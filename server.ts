import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";
import { PrismaClient, TransactionType, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;
const SESSION_COOKIE = "altrack_session";
const SESSION_DAYS = 7;

if (!databaseUrl)
  throw new Error("DATABASE_URL environment variable is not defined in .env.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string; role: UserRole; emailNotifications: boolean };
    }
  }
}

app.use(express.json({ limit: "5mb" }));

const numberOr = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normaliseEmail = (email: unknown) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const publicUser = (user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  emailNotifications: boolean;
  createdAt?: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isActive: user.isActive,
  emailNotifications: user.emailNotifications,
  ...(user.createdAt ? { createdAt: user.createdAt } : {}),
});

const hashToken = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, encoded: string) => {
  const [salt, stored] = encoded.split(":");
  if (!salt || !stored) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(stored, "hex"),
    Buffer.from(actual, "hex"),
  );
};

const parseCookies = (header?: string) =>
  Object.fromEntries(
    (header || "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [
          part.slice(0, index).trim(),
          decodeURIComponent(part.slice(index + 1).trim()),
        ];
      }),
  );

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  path: "/",
};

const smtpPort = Number(process.env.SMTP_PORT || 587);
const emailDeliveryConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
const emailTransport = emailDeliveryConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
      ...(process.env.SMTP_USER && process.env.SMTP_PASS
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {}),
    })
  : null;

const sendNotificationEmail = async (
  user: { email: string; name: string; emailNotifications: boolean },
  subject: string,
  text: string,
) => {
  if (!emailTransport || !user.emailNotifications) return false;
  await emailTransport.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject,
    text: `Hi ${user.name},\n\n${text}\n\n— Altrack`,
  });
  return true;
};

const sendEmailInBackground = (
  user: { email: string; name: string; emailNotifications: boolean },
  subject: string,
  text: string,
) => {
  void sendNotificationEmail(user, subject, text).catch((error) =>
    console.error("Email notification error:", error),
  );
};

const createSession = async (res: Response, userId: string) => {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
};

const databaseRequired = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res
      .status(503)
      .json({
        error:
          "Database unavailable. Check DATABASE_URL and the database connection.",
      });
  }
};

const attachUser = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (!token) return next();
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      return next();
    }
    req.user = publicUser(session.user);
    next();
  } catch (error) {
    next(error);
  }
};

const requireSignedIn = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Sign in is required." });
  next();
};

// Platform administrators have no route to financial data by design.
const requireFinanceUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Sign in is required." });
  if (req.user.role !== UserRole.USER)
    return res
      .status(403)
      .json({
        error: "Platform administrators cannot access customer financial data.",
      });
  next();
};

const requirePlatformAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Sign in is required." });
  if (req.user.role !== UserRole.PLATFORM_ADMIN)
    return res
      .status(403)
      .json({ error: "Platform administrator access is required." });
  next();
};

const sendDatabaseError = (res: Response, error: unknown, action: string) => {
  console.error(`Database ${action} error:`, error);
  res
    .status((error as { code?: string })?.code === "P2025" ? 404 : 500)
    .json({ error: `Unable to ${action}.` });
};

const owned = async <T>(
  find: () => Promise<T | null>,
  res: Response,
  label: string,
): Promise<T | null> => {
  const record = await find();
  if (!record) res.status(404).json({ error: `${label} not found.` });
  return record;
};

const assertReferences = async (
  userId: string,
  accountId: string,
  categoryId?: string | null,
  toAccountId?: string | null,
) => {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account)
    throw new Error("Selected account is not available in your workspace.");
  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
    if (!category)
      throw new Error("Selected category is not available in your workspace.");
  }
  if (toAccountId) {
    const destination = await prisma.account.findFirst({
      where: { id: toAccountId, userId },
    });
    if (!destination)
      throw new Error(
        "Destination account is not available in your workspace.",
      );
  }
};

const adjustTransactionBalance = async (
  tx: any,
  userId: string,
  transaction: {
    type: TransactionType;
    amount: number;
    accountId: string;
    toAccountId: string | null;
  },
  multiplier: 1 | -1,
) => {
  const change = transaction.amount * multiplier;
  if (transaction.type === "INCOME") {
    await tx.account.updateMany({
      where: { id: transaction.accountId, userId },
      data: { balance: { increment: change } },
    });
  } else if (transaction.type === "EXPENSE") {
    await tx.account.updateMany({
      where: { id: transaction.accountId, userId },
      data: { balance: { decrement: change } },
    });
  } else if (transaction.toAccountId) {
    await tx.account.updateMany({
      where: { id: transaction.accountId, userId },
      data: { balance: { decrement: change } },
    });
    await tx.account.updateMany({
      where: { id: transaction.toAccountId, userId },
      data: { balance: { increment: change } },
    });
  }
};

const notifyBudgetThreshold = async (
  userId: string,
  categoryId: string | null,
  transactionDate: Date,
) => {
  if (!categoryId || !emailDeliveryConfigured) return;
  const month = transactionDate.getUTCMonth() + 1;
  const year = transactionDate.getUTCFullYear();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const [user, category, budget, spending] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.category.findFirst({ where: { id: categoryId, userId } }),
    prisma.budget.findFirst({ where: { userId, categoryId, month, year } }),
    prisma.transaction.aggregate({
      where: { userId, categoryId, type: TransactionType.EXPENSE, date: { gte: monthStart, lt: nextMonth } },
      _sum: { amount: true },
    }),
  ]);
  if (!user || !user.emailNotifications || !category || !budget || budget.amountLimit <= 0) return;
  const ratio = (spending._sum.amount || 0) / budget.amountLimit;
  const threshold = ratio >= 1 ? 100 : ratio >= 0.8 ? 80 : 0;
  if (!threshold) return;
  const dedupeKey = `budget-${year}-${month}-${categoryId}-${threshold}`;
  try {
    const notification = await prisma.emailNotification.create({
      data: { userId, type: "BUDGET_THRESHOLD", dedupeKey },
    });
    const message = threshold === 100
      ? `Your ${category.name} budget has reached or exceeded its limit for ${transactionDate.toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" })}.`
      : `Your ${category.name} budget has reached 80% of its limit for ${transactionDate.toLocaleString("en", { month: "long", year: "numeric", timeZone: "UTC" })}.`;
    try {
      await sendNotificationEmail(user, `Altrack budget alert: ${category.name}`, message);
    } catch (error) {
      await prisma.emailNotification.delete({ where: { id: notification.id } });
      throw error;
    }
  } catch (error: any) {
    if (error?.code !== "P2002") console.error("Budget notification error:", error);
  }
};

app.use("/api", databaseRequired, attachUser);

app.get("/api/health", (_req, res) => {
  res.json({
    connected: true,
    engine: "PostgreSQL (Prisma)",
    databaseUrlConfigured: true,
  });
});

// Authentication and first-administrator bootstrap
app.get("/api/auth/bootstrap-status", async (_req, res) => {
  const userCount = await prisma.user.count();
  res.json({ needsInitialAdmin: userCount === 0 });
});

app.get("/api/auth/me", (req, res) => res.json({ user: req.user || null }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const email = normaliseEmail(req.body.email);
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || !name || password.length < 10)
      return res
        .status(400)
        .json({
          error:
            "Enter a name, valid email, and a password of at least 10 characters.",
        });
    const count = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        email,
        name: name.slice(0, 100),
        passwordHash: hashPassword(password),
        role: count === 0 ? UserRole.PLATFORM_ADMIN : UserRole.USER,
      },
    });
    await createSession(res, user.id);
    sendEmailInBackground(
      user,
      "Welcome to Altrack",
      "Your account is ready. You can sign in to access your private workspace.",
    );
    res.status(201).json({ user: publicUser(user), needsInitialAdmin: false });
  } catch (error: any) {
    if (error?.code === "P2002")
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    sendDatabaseError(res, error, "register account");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: normaliseEmail(req.body.email) },
    });
    if (
      !user ||
      !verifyPassword(
        typeof req.body.password === "string" ? req.body.password : "",
        user.passwordHash,
      )
    )
      return res.status(401).json({ error: "Email or password is incorrect." });
    if (!user.isActive)
      return res
        .status(403)
        .json({
          error: "This account has been disabled. Contact an administrator.",
        });
    await createSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    sendDatabaseError(res, error, "sign in");
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token)
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).end();
});

// Identity administration intentionally exposes no financial data.
app.get("/api/admin/users", requirePlatformAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

app.post("/api/admin/users", requirePlatformAdmin, async (req, res) => {
  try {
    const email = normaliseEmail(req.body.email);
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    const role =
      req.body.role === UserRole.PLATFORM_ADMIN
        ? UserRole.PLATFORM_ADMIN
        : UserRole.USER;
    if (!/^\S+@\S+\.\S+$/.test(email) || !name || password.length < 10)
      return res
        .status(400)
        .json({
          error:
            "Enter a name, valid email, and a password of at least 10 characters.",
        });
    const user = await prisma.user.create({
      data: {
        email,
        name: name.slice(0, 100),
        passwordHash: hashPassword(password),
        role,
      },
    });
    sendEmailInBackground(
      user,
      "Your Altrack account has been created",
      "A platform administrator created your account. Use the sign-in details provided by them to access Altrack.",
    );
    res.status(201).json(publicUser(user));
  } catch (error: any) {
    if (error?.code === "P2002")
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    sendDatabaseError(res, error, "create user");
  }
});

app.patch("/api/admin/users/:id", requirePlatformAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user!.id)
      return res
        .status(400)
        .json({ error: "Administrators cannot change their own access here." });
    const update: { name?: string; role?: UserRole; isActive?: boolean } = {};
    if (typeof req.body.name === "string" && req.body.name.trim())
      update.name = req.body.name.trim().slice(0, 100);
    if (typeof req.body.isActive === "boolean")
      update.isActive = req.body.isActive;
    if (
      req.body.role === UserRole.USER ||
      req.body.role === UserRole.PLATFORM_ADMIN
    )
      update.role = req.body.role;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: update,
    });
    if (update.isActive === false)
      await prisma.session.deleteMany({ where: { userId: user.id } });
    if (update.isActive !== undefined) {
      sendEmailInBackground(
        user,
        update.isActive ? "Your Altrack access has been restored" : "Your Altrack access has been disabled",
        update.isActive
          ? "A platform administrator restored access to your account."
          : "A platform administrator disabled access to your account. Contact them if you believe this is unexpected.",
      );
    }
    res.json(publicUser(user));
  } catch (error) {
    sendDatabaseError(res, error, "update user");
  }
});

// A one-time recovery path for records created before tenant isolation existed.
// It never reads or returns financial records; it only assigns orphaned rows.
app.get("/api/admin/legacy-status", requirePlatformAdmin, async (_req, res) => {
  const [account, category, transaction, budget, goal, recurring] =
    await Promise.all([
      prisma.account.findFirst({
        where: { userId: null },
        select: { id: true },
      }),
      prisma.category.findFirst({
        where: { userId: null },
        select: { id: true },
      }),
      prisma.transaction.findFirst({
        where: { userId: null },
        select: { id: true },
      }),
      prisma.budget.findFirst({
        where: { userId: null },
        select: { id: true },
      }),
      prisma.savingsGoal.findFirst({
        where: { userId: null },
        select: { id: true },
      }),
      prisma.recurringTransaction.findFirst({
        where: { userId: null },
        select: { id: true },
      }),
    ]);
  res.json({
    hasLegacyWorkspace: Boolean(
      account || category || transaction || budget || goal || recurring,
    ),
  });
});

app.post("/api/admin/legacy/assign", requirePlatformAdmin, async (req, res) => {
  try {
    const target = await prisma.user.findFirst({
      where: { id: req.body.userId, role: UserRole.USER, isActive: true },
    });
    if (!target)
      return res
        .status(400)
        .json({ error: "Choose an active financial-workspace user." });
    await prisma.$transaction(async (tx) => {
      await tx.account.updateMany({
        where: { userId: null },
        data: { userId: target.id },
      });
      await tx.category.updateMany({
        where: { userId: null },
        data: { userId: target.id },
      });
      await tx.transaction.updateMany({
        where: { userId: null },
        data: { userId: target.id },
      });
      await tx.budget.updateMany({
        where: { userId: null },
        data: { userId: target.id },
      });
      await tx.savingsGoal.updateMany({
        where: { userId: null },
        data: { userId: target.id },
      });
      await tx.recurringTransaction.updateMany({
        where: { userId: null },
        data: { userId: target.id },
      });
      // Old global settings are deliberately discarded rather than exposing them.
      await tx.appSettings.deleteMany({ where: { userId: null } });
    });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "assign legacy workspace");
  }
});

// All remaining routes are tenant-scoped financial routes.
app.use("/api", requireFinanceUser);

app.get("/api/notifications/preferences", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ email: user.email, emailNotifications: user.emailNotifications, emailDeliveryConfigured });
});
app.put("/api/notifications/preferences", async (req, res) => {
  if (typeof req.body.emailNotifications !== "boolean")
    return res.status(400).json({ error: "emailNotifications must be true or false." });
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { emailNotifications: req.body.emailNotifications },
  });
  res.json({ email: user.email, emailNotifications: user.emailNotifications, emailDeliveryConfigured });
});

app.get("/api/settings", async (req, res) => {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { userId: req.user!.id },
      update: {},
      create: { userId: req.user!.id },
    });
    res.json(settings);
  } catch (error) {
    sendDatabaseError(res, error, "load settings");
  }
});
app.put("/api/settings", async (req, res) => {
  try {
    const currency =
      typeof req.body.currency === "string"
        ? req.body.currency.toUpperCase()
        : "";
    if (!/^[A-Z]{3}$/.test(currency))
      return res
        .status(400)
        .json({ error: "Currency must be a three-letter ISO code." });
    res.json(
      await prisma.appSettings.upsert({
        where: { userId: req.user!.id },
        update: { currency },
        create: { userId: req.user!.id, currency },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update settings");
  }
});

app.get("/api/accounts", async (req, res) => {
  try {
    res.json(
      await prisma.account.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "load accounts");
  }
});
app.post("/api/accounts", async (req, res) => {
  try {
    const {
      name,
      type = "BANK",
      balance = 0,
      currency = "USD",
      color = "#10B981",
      isDefault = false,
    } = req.body;
    if (!name || typeof name !== "string")
      return res.status(400).json({ error: "Account name is required." });
    res
      .status(201)
      .json(
        await prisma.account.create({
          data: {
            userId: req.user!.id,
            name: name.trim(),
            type,
            balance: numberOr(balance),
            currency,
            color,
            isDefault: Boolean(isDefault),
          },
        }),
      );
  } catch (error) {
    sendDatabaseError(res, error, "create account");
  }
});
app.put("/api/accounts/:id", async (req, res) => {
  try {
    const account = await owned(
      () =>
        prisma.account.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Account",
    );
    if (!account) return;
    const { balance, userId: _userId, id: _id, ...data } = req.body;
    res.json(
      await prisma.account.update({
        where: { id: account.id },
        data: {
          ...data,
          ...(balance !== undefined ? { balance: numberOr(balance) } : {}),
        },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update account");
  }
});
app.delete("/api/accounts/:id", async (req, res) => {
  try {
    const account = await owned(
      () =>
        prisma.account.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Account",
    );
    if (!account) return;
    await prisma.account.delete({ where: { id: account.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete account");
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    res.json(
      await prisma.category.findMany({
        where: { userId: req.user!.id },
        orderBy: { name: "asc" },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "load categories");
  }
});
app.post("/api/categories", async (req, res) => {
  try {
    const {
      name,
      type = "EXPENSE",
      icon = "tag",
      color = "#6366F1",
    } = req.body;
    if (!name || typeof name !== "string")
      return res.status(400).json({ error: "Category name is required." });
    res
      .status(201)
      .json(
        await prisma.category.create({
          data: { userId: req.user!.id, name: name.trim(), type, icon, color },
        }),
      );
  } catch (error) {
    sendDatabaseError(res, error, "create category");
  }
});
app.put("/api/categories/:id", async (req, res) => {
  try {
    const category = await owned(
      () =>
        prisma.category.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Category",
    );
    if (!category) return;
    const { userId: _userId, id: _id, ...data } = req.body;
    res.json(
      await prisma.category.update({ where: { id: category.id }, data }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update category");
  }
});
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const category = await owned(
      () =>
        prisma.category.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Category",
    );
    if (!category) return;
    await prisma.category.delete({ where: { id: category.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete category");
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    res.json(
      await prisma.transaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { date: "desc" },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "load transactions");
  }
});
app.post("/api/transactions", async (req, res) => {
  try {
    const {
      amount,
      type = "EXPENSE",
      date,
      description,
      categoryId,
      accountId,
      toAccountId,
      isRecurring = false,
      notes,
      tags = [],
    } = req.body;
    if (!accountId || !description || !date)
      return res
        .status(400)
        .json({ error: "Account, description, and date are required." });
    if (type === "TRANSFER" && (!toAccountId || toAccountId === accountId))
      return res
        .status(400)
        .json({ error: "A transfer needs a different destination account." });
    await assertReferences(req.user!.id, accountId, categoryId, toAccountId);
    const transaction = await prisma.$transaction(async (tx) => {
      const record = await tx.transaction.create({
        data: {
          userId: req.user!.id,
          amount: Math.abs(numberOr(amount)),
          type,
          date: new Date(date),
          description,
          categoryId: categoryId || null,
          accountId,
          toAccountId: toAccountId || null,
          isRecurring: Boolean(isRecurring),
          notes: notes || null,
          tags: Array.isArray(tags) ? tags : [],
        },
      });
      await adjustTransactionBalance(tx, req.user!.id, record, 1);
      return record;
    });
    if (transaction.type === "EXPENSE") {
      void notifyBudgetThreshold(req.user!.id, transaction.categoryId, transaction.date);
    }
    res.status(201).json(transaction);
  } catch (error) {
    sendDatabaseError(res, error, "create transaction");
  }
});
app.put("/api/transactions/:id", async (req, res) => {
  try {
    const previous = await owned(
      () =>
        prisma.transaction.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Transaction",
    );
    if (!previous) return;
    const {
      amount,
      date,
      categoryId,
      accountId,
      toAccountId,
      tags,
      userId: _userId,
      id: _id,
      ...data
    } = req.body;
    const nextAccountId =
      accountId === undefined ? previous.accountId : accountId;
    const nextCategoryId =
      categoryId === undefined ? previous.categoryId : categoryId || null;
    const nextToAccountId =
      toAccountId === undefined ? previous.toAccountId : toAccountId || null;
    const nextType = data.type || previous.type;
    if (
      nextType === "TRANSFER" &&
      (!nextToAccountId || nextToAccountId === nextAccountId)
    )
      return res
        .status(400)
        .json({ error: "A transfer needs a different destination account." });
    await assertReferences(
      req.user!.id,
      nextAccountId,
      nextCategoryId,
      nextToAccountId,
    );
    const transaction = await prisma.$transaction(async (tx) => {
      const next = await tx.transaction.update({
        where: { id: previous.id },
        data: {
          ...data,
          accountId: nextAccountId,
          ...(amount !== undefined
            ? { amount: Math.abs(numberOr(amount)) }
            : {}),
          ...(date ? { date: new Date(date) } : {}),
          ...(categoryId !== undefined ? { categoryId: nextCategoryId } : {}),
          ...(toAccountId !== undefined
            ? { toAccountId: nextToAccountId }
            : {}),
          ...(tags !== undefined
            ? { tags: Array.isArray(tags) ? tags : [] }
            : {}),
        },
      });
      await adjustTransactionBalance(tx, req.user!.id, previous, -1);
      await adjustTransactionBalance(tx, req.user!.id, next, 1);
      return next;
    });
    res.json(transaction);
  } catch (error) {
    sendDatabaseError(res, error, "update transaction");
  }
});
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const transaction = await owned(
      () =>
        prisma.transaction.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Transaction",
    );
    if (!transaction) return;
    await prisma.$transaction(async (tx) => {
      await adjustTransactionBalance(tx, req.user!.id, transaction, -1);
      await tx.transaction.delete({ where: { id: transaction.id } });
    });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete transaction");
  }
});

app.get("/api/budgets", async (req, res) => {
  try {
    res.json(await prisma.budget.findMany({ where: { userId: req.user!.id } }));
  } catch (error) {
    sendDatabaseError(res, error, "load budgets");
  }
});
app.post("/api/budgets", async (req, res) => {
  try {
    const { categoryId, amountLimit, month, year } = req.body;
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: req.user!.id },
    });
    if (!category)
      return res
        .status(400)
        .json({ error: "Category is not available in your workspace." });
    const monthValue = numberOr(month);
    const yearValue = numberOr(year);
    res.json(
      await prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId: req.user!.id,
            categoryId,
            month: monthValue,
            year: yearValue,
          },
        },
        update: { amountLimit: numberOr(amountLimit) },
        create: {
          userId: req.user!.id,
          categoryId,
          amountLimit: numberOr(amountLimit),
          month: monthValue,
          year: yearValue,
        },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "save budget");
  }
});
app.delete("/api/budgets/:id", async (req, res) => {
  try {
    const budget = await owned(
      () =>
        prisma.budget.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Budget",
    );
    if (!budget) return;
    await prisma.budget.delete({ where: { id: budget.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete budget");
  }
});

app.get("/api/savings-goals", async (req, res) => {
  try {
    res.json(
      await prisma.savingsGoal.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "load savings goals");
  }
});
app.post("/api/savings-goals", async (req, res) => {
  try {
    const {
      name,
      targetAmount,
      currentAmount = 0,
      targetDate,
      color = "#10B981",
      category = "General",
    } = req.body;
    if (!name || !targetDate)
      return res
        .status(400)
        .json({ error: "Goal name and target date are required." });
    res
      .status(201)
      .json(
        await prisma.savingsGoal.create({
          data: {
            userId: req.user!.id,
            name,
            targetAmount: numberOr(targetAmount),
            currentAmount: numberOr(currentAmount),
            targetDate: new Date(targetDate),
            color,
            category,
          },
        }),
      );
  } catch (error) {
    sendDatabaseError(res, error, "create savings goal");
  }
});
app.put("/api/savings-goals/:id", async (req, res) => {
  try {
    const goal = await owned(
      () =>
        prisma.savingsGoal.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Savings goal",
    );
    if (!goal) return;
    const {
      targetAmount,
      currentAmount,
      targetDate,
      userId: _userId,
      id: _id,
      ...data
    } = req.body;
    res.json(
      await prisma.savingsGoal.update({
        where: { id: goal.id },
        data: {
          ...data,
          ...(targetAmount !== undefined
            ? { targetAmount: numberOr(targetAmount) }
            : {}),
          ...(currentAmount !== undefined
            ? { currentAmount: numberOr(currentAmount) }
            : {}),
          ...(targetDate ? { targetDate: new Date(targetDate) } : {}),
        },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update savings goal");
  }
});
app.delete("/api/savings-goals/:id", async (req, res) => {
  try {
    const goal = await owned(
      () =>
        prisma.savingsGoal.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Savings goal",
    );
    if (!goal) return;
    await prisma.savingsGoal.delete({ where: { id: goal.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete savings goal");
  }
});

app.get("/api/recurring", async (req, res) => {
  try {
    res.json(
      await prisma.recurringTransaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { nextDueDate: "asc" },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "load recurring transactions");
  }
});
app.post("/api/recurring", async (req, res) => {
  try {
    const {
      amount,
      type = "EXPENSE",
      frequency = "MONTHLY",
      nextDueDate,
      description,
      categoryId,
      accountId,
      isActive = true,
    } = req.body;
    if (!accountId || !description || !nextDueDate)
      return res
        .status(400)
        .json({
          error: "Account, description, and next due date are required.",
        });
    await assertReferences(req.user!.id, accountId, categoryId);
    res
      .status(201)
      .json(
        await prisma.recurringTransaction.create({
          data: {
            userId: req.user!.id,
            amount: Math.abs(numberOr(amount)),
            type,
            frequency,
            nextDueDate: new Date(nextDueDate),
            description,
            categoryId: categoryId || null,
            accountId,
            isActive: Boolean(isActive),
          },
        }),
      );
  } catch (error) {
    sendDatabaseError(res, error, "create recurring transaction");
  }
});
app.put("/api/recurring/:id", async (req, res) => {
  try {
    const item = await owned(
      () =>
        prisma.recurringTransaction.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Recurring transaction",
    );
    if (!item) return;
    const {
      amount,
      nextDueDate,
      categoryId,
      accountId,
      userId: _userId,
      id: _id,
      ...data
    } = req.body;
    const nextAccountId = accountId === undefined ? item.accountId : accountId;
    const nextCategoryId =
      categoryId === undefined ? item.categoryId : categoryId || null;
    await assertReferences(req.user!.id, nextAccountId, nextCategoryId);
    res.json(
      await prisma.recurringTransaction.update({
        where: { id: item.id },
        data: {
          ...data,
          accountId: nextAccountId,
          ...(amount !== undefined
            ? { amount: Math.abs(numberOr(amount)) }
            : {}),
          ...(nextDueDate ? { nextDueDate: new Date(nextDueDate) } : {}),
          ...(categoryId !== undefined ? { categoryId: nextCategoryId } : {}),
        },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update recurring transaction");
  }
});
app.delete("/api/recurring/:id", async (req, res) => {
  try {
    const item = await owned(
      () =>
        prisma.recurringTransaction.findFirst({
          where: { id: req.params.id, userId: req.user!.id },
        }),
      res,
      "Recurring transaction",
    );
    if (!item) return;
    await prisma.recurringTransaction.delete({ where: { id: item.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete recurring transaction");
  }
});

app.post("/api/database/import", async (req, res) => {
  try {
    const {
      accounts,
      categories,
      transactions,
      budgets,
      savingsGoals,
      recurring,
    } = req.body;
    if (
      ![
        accounts,
        categories,
        transactions,
        budgets,
        savingsGoals,
        recurring,
      ].every(Array.isArray)
    )
      return res
        .status(400)
        .json({
          error: "The backup does not contain a complete finance dataset.",
        });
    const userId = req.user!.id;
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.recurringTransaction.deleteMany({ where: { userId } });
      await tx.savingsGoal.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      if (categories.length)
        await tx.category.createMany({
          data: categories.map((c: any) => ({
            id: c.id,
            userId,
            name: c.name,
            type: c.type,
            icon: c.icon || "tag",
            color: c.color || "#6366F1",
          })),
        });
      if (accounts.length)
        await tx.account.createMany({
          data: accounts.map((a: any) => ({
            id: a.id,
            userId,
            name: a.name,
            type: a.type,
            balance: numberOr(a.balance),
            currency: a.currency || "ETB",
            color: a.color || "#10B981",
            isDefault: Boolean(a.isDefault),
          })),
        });
      if (transactions.length)
        await tx.transaction.createMany({
          data: transactions.map((t: any) => ({
            id: t.id,
            userId,
            amount: Math.abs(numberOr(t.amount)),
            type: t.type,
            date: new Date(t.date),
            description: t.description,
            categoryId: t.categoryId || null,
            accountId: t.accountId,
            toAccountId: t.toAccountId || null,
            isRecurring: Boolean(t.isRecurring),
            notes: t.notes || null,
            tags: Array.isArray(t.tags) ? t.tags : [],
          })),
        });
      if (budgets.length)
        await tx.budget.createMany({
          data: budgets.map((b: any) => ({
            id: b.id,
            userId,
            categoryId: b.categoryId,
            amountLimit: numberOr(b.amountLimit),
            month: numberOr(b.month),
            year: numberOr(b.year),
          })),
        });
      if (savingsGoals.length)
        await tx.savingsGoal.createMany({
          data: savingsGoals.map((g: any) => ({
            id: g.id,
            userId,
            name: g.name,
            targetAmount: numberOr(g.targetAmount),
            currentAmount: numberOr(g.currentAmount),
            targetDate: new Date(g.targetDate),
            color: g.color || "#10B981",
            category: g.category || "General",
          })),
        });
      if (recurring.length)
        await tx.recurringTransaction.createMany({
          data: recurring.map((r: any) => ({
            id: r.id,
            userId,
            amount: Math.abs(numberOr(r.amount)),
            type: r.type,
            frequency: r.frequency,
            nextDueDate: new Date(r.nextDueDate),
            description: r.description,
            categoryId: r.categoryId || null,
            accountId: r.accountId,
            isActive: r.isActive !== false,
          })),
        });
    });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "import backup");
  }
});
app.post("/api/database/clear-all", async (req, res) => {
  try {
    const userId = req.user!.id;
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.savingsGoal.deleteMany({ where: { userId } });
      await tx.recurringTransaction.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      if (!req.body.keepCategories)
        await tx.category.deleteMany({ where: { userId } });
    });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "clear database");
  }
});

// The only information sent to Gemini is this user's selected financial summary.
app.post("/api/ai/insights", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY)
      return res.status(503).json({ error: "AI insights are not configured." });
    const userId = req.user!.id;
    const [settings, transactions, budgets, categories] = await Promise.all([
      prisma.appSettings.findUnique({ where: { userId } }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        select: { amount: true, type: true, date: true, categoryId: true },
        orderBy: { date: "desc" },
        take: 250,
      }),
      prisma.budget.findMany({
        where: { userId },
        select: {
          amountLimit: true,
          month: true,
          year: true,
          categoryId: true,
        },
      }),
      prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true },
      }),
    ]);
    const categoryNames = Object.fromEntries(
      categories.map((category) => [category.id, category.name]),
    );
    const totals = transactions.reduce(
      (summary, transaction) => {
        const key =
          transaction.type === "INCOME"
            ? "income"
            : transaction.type === "EXPENSE"
              ? "expenses"
              : "transfers";
        summary[key] += transaction.amount;
        if (transaction.type === "EXPENSE") {
          const category =
            categoryNames[transaction.categoryId || ""] || "Uncategorised";
          summary.byCategory[category] =
            (summary.byCategory[category] || 0) + transaction.amount;
        }
        return summary;
      },
      {
        income: 0,
        expenses: 0,
        transfers: 0,
        byCategory: {} as Record<string, number>,
      },
    );
    const payload = {
      currency: settings?.currency || "USD",
      period: "last 90 days",
      totals,
      budgets: budgets.map((budget) => ({
        category: categoryNames[budget.categoryId] || "Uncategorised",
        limit: budget.amountLimit,
        month: budget.month,
        year: budget.year,
      })),
    };
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: `Analyze this personal-finance aggregate. Return practical, non-judgmental observations only. Never provide investment, tax, legal, or debt advice. Do not invent data. Data: ${JSON.stringify(payload)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            disclaimer: { type: Type.STRING },
          },
          required: ["summary", "highlights", "actions", "disclaimer"],
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    if (
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.highlights) ||
      !Array.isArray(parsed.actions)
    )
      throw new Error("Gemini returned an invalid insight response.");
    res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
      period: payload.period,
    });
  } catch (error) {
    console.error("AI insight error:", error);
    res
      .status(502)
      .json({
        error: "Unable to generate insights right now. Please try again.",
      });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    const resolvedDist = fs.existsSync(distPath)
      ? distPath
      : path.join(process.cwd(), "dist");
    app.use(express.static(resolvedDist));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(resolvedDist, "index.html")),
    );
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  app.listen(port, "0.0.0.0", () =>
    console.log(`Altrack server running on http://0.0.0.0:${port}`),
  );
}

startServer();
