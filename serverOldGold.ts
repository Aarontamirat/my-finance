import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient, TransactionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl)
  throw new Error("DATABASE_URL environment variable is not defined in .env.");

// The configured PostgreSQL database is the only source of truth. Prisma 7
// connects through its PostgreSQL driver adapter; there is no mock fallback.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

app.use(express.json({ limit: "5mb" }));

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

const sendDatabaseError = (res: Response, error: unknown, action: string) => {
  console.error(`Database ${action} error:`, error);
  res
    .status((error as { code?: string })?.code === "P2025" ? 404 : 500)
    .json({ error: `Unable to ${action}.` });
};

const numberOr = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const adjustTransactionBalance = async (
  tx: any,
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
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: change } },
    });
  } else if (transaction.type === "EXPENSE") {
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: change } },
    });
  } else if (transaction.toAccountId) {
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { decrement: change } },
    });
    await tx.account.update({
      where: { id: transaction.toAccountId },
      data: { balance: { increment: change } },
    });
  }
};

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      connected: true,
      engine: "PostgreSQL (Prisma)",
      databaseUrlConfigured: true,
    });
  } catch (error: any) {
    res
      .status(503)
      .json({
        connected: false,
        engine: "PostgreSQL (Prisma)",
        databaseUrlConfigured: Boolean(databaseUrl),
        error: error.message,
      });
  }
});

app.use("/api", databaseRequired);

// Shared application settings are also persisted in the configured database,
// so currency formatting is consistent across browser sessions and devices.
app.get("/api/settings", async (_req, res) => {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
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
        where: { id: "default" },
        update: { currency },
        create: { id: "default", currency },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update settings");
  }
});

// Accounts
app.get("/api/accounts", async (_req, res) => {
  try {
    res.json(await prisma.account.findMany({ orderBy: { createdAt: "desc" } }));
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
    if (!name)
      return res.status(400).json({ error: "Account name is required." });
    res
      .status(201)
      .json(
        await prisma.account.create({
          data: {
            name,
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
    const { balance, ...data } = req.body;
    res.json(
      await prisma.account.update({
        where: { id: req.params.id },
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
    await prisma.account.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete account");
  }
});

// Categories
app.get("/api/categories", async (_req, res) => {
  try {
    res.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
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
    if (!name)
      return res.status(400).json({ error: "Category name is required." });
    res
      .status(201)
      .json(
        await prisma.category.create({ data: { name, type, icon, color } }),
      );
  } catch (error) {
    sendDatabaseError(res, error, "create category");
  }
});
app.put("/api/categories/:id", async (req, res) => {
  try {
    res.json(
      await prisma.category.update({
        where: { id: req.params.id },
        data: req.body,
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update category");
  }
});
app.delete("/api/categories/:id", async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete category");
  }
});

// Transactions
app.get("/api/transactions", async (_req, res) => {
  try {
    res.json(await prisma.transaction.findMany({ orderBy: { date: "desc" } }));
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
    const transaction = await prisma.$transaction(async (tx) => {
      const record = await tx.transaction.create({
        data: {
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
      await adjustTransactionBalance(tx, record, 1);
      return record;
    });
    res.status(201).json(transaction);
  } catch (error) {
    sendDatabaseError(res, error, "create transaction");
  }
});
app.put("/api/transactions/:id", async (req, res) => {
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const previous = await tx.transaction.findUniqueOrThrow({
        where: { id: req.params.id },
      });
      const { amount, date, categoryId, toAccountId, tags, ...data } = req.body;
      const next = await tx.transaction.update({
        where: { id: req.params.id },
        data: {
          ...data,
          ...(amount !== undefined
            ? { amount: Math.abs(numberOr(amount)) }
            : {}),
          ...(date ? { date: new Date(date) } : {}),
          ...(categoryId !== undefined
            ? { categoryId: categoryId || null }
            : {}),
          ...(toAccountId !== undefined
            ? { toAccountId: toAccountId || null }
            : {}),
          ...(tags !== undefined
            ? { tags: Array.isArray(tags) ? tags : [] }
            : {}),
        },
      });
      if (
        next.type === "TRANSFER" &&
        (!next.toAccountId || next.toAccountId === next.accountId)
      )
        throw new Error("A transfer needs a different destination account.");
      await adjustTransactionBalance(tx, previous, -1);
      await adjustTransactionBalance(tx, next, 1);
      return next;
    });
    res.json(transaction);
  } catch (error) {
    sendDatabaseError(res, error, "update transaction");
  }
});
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUniqueOrThrow({
        where: { id: req.params.id },
      });
      await adjustTransactionBalance(tx, transaction, -1);
      await tx.transaction.delete({ where: { id: req.params.id } });
    });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete transaction");
  }
});

// Budgets
app.get("/api/budgets", async (_req, res) => {
  try {
    res.json(await prisma.budget.findMany());
  } catch (error) {
    sendDatabaseError(res, error, "load budgets");
  }
});
app.post("/api/budgets", async (req, res) => {
  try {
    const { categoryId, amountLimit, month, year } = req.body;
    res.json(
      await prisma.budget.upsert({
        where: {
          categoryId_month_year: {
            categoryId,
            month: numberOr(month),
            year: numberOr(year),
          },
        },
        update: { amountLimit: numberOr(amountLimit) },
        create: {
          categoryId,
          amountLimit: numberOr(amountLimit),
          month: numberOr(month),
          year: numberOr(year),
        },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "save budget");
  }
});
app.delete("/api/budgets/:id", async (req, res) => {
  try {
    await prisma.budget.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete budget");
  }
});

// Savings goals
app.get("/api/savings-goals", async (_req, res) => {
  try {
    res.json(
      await prisma.savingsGoal.findMany({ orderBy: { createdAt: "desc" } }),
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
    const { targetAmount, currentAmount, targetDate, ...data } = req.body;
    res.json(
      await prisma.savingsGoal.update({
        where: { id: req.params.id },
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
    await prisma.savingsGoal.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    sendDatabaseError(res, error, "delete savings goal");
  }
});

// Recurring transactions
app.get("/api/recurring", async (_req, res) => {
  try {
    res.json(
      await prisma.recurringTransaction.findMany({
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
    res
      .status(201)
      .json(
        await prisma.recurringTransaction.create({
          data: {
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
    const { amount, nextDueDate, categoryId, ...data } = req.body;
    res.json(
      await prisma.recurringTransaction.update({
        where: { id: req.params.id },
        data: {
          ...data,
          ...(amount !== undefined
            ? { amount: Math.abs(numberOr(amount)) }
            : {}),
          ...(nextDueDate ? { nextDueDate: new Date(nextDueDate) } : {}),
          ...(categoryId !== undefined
            ? { categoryId: categoryId || null }
            : {}),
        },
      }),
    );
  } catch (error) {
    sendDatabaseError(res, error, "update recurring transaction");
  }
});
app.delete("/api/recurring/:id", async (req, res) => {
  try {
    await prisma.recurringTransaction.delete({ where: { id: req.params.id } });
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
      !Array.isArray(accounts) ||
      !Array.isArray(categories) ||
      !Array.isArray(transactions) ||
      !Array.isArray(budgets) ||
      !Array.isArray(savingsGoals) ||
      !Array.isArray(recurring)
    ) {
      return res
        .status(400)
        .json({
          error: "The backup does not contain a complete finance dataset.",
        });
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany();
      await tx.budget.deleteMany();
      await tx.recurringTransaction.deleteMany();
      await tx.savingsGoal.deleteMany();
      await tx.account.deleteMany();
      await tx.category.deleteMany();
      if (categories.length)
        await tx.category.createMany({
          data: categories.map((category: any) => ({
            id: category.id,
            name: category.name,
            type: category.type,
            icon: category.icon || "tag",
            color: category.color || "#6366F1",
          })),
        });
      if (accounts.length)
        await tx.account.createMany({
          data: accounts.map((account: any) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            balance: numberOr(account.balance),
            currency: account.currency || "USD",
            color: account.color || "#10B981",
            isDefault: Boolean(account.isDefault),
          })),
        });
      if (transactions.length)
        await tx.transaction.createMany({
          data: transactions.map((transaction: any) => ({
            id: transaction.id,
            amount: Math.abs(numberOr(transaction.amount)),
            type: transaction.type,
            date: new Date(transaction.date),
            description: transaction.description,
            categoryId: transaction.categoryId || null,
            accountId: transaction.accountId,
            toAccountId: transaction.toAccountId || null,
            isRecurring: Boolean(transaction.isRecurring),
            notes: transaction.notes || null,
            tags: Array.isArray(transaction.tags) ? transaction.tags : [],
          })),
        });
      if (budgets.length)
        await tx.budget.createMany({
          data: budgets.map((budget: any) => ({
            id: budget.id,
            categoryId: budget.categoryId,
            amountLimit: numberOr(budget.amountLimit),
            month: numberOr(budget.month),
            year: numberOr(budget.year),
          })),
        });
      if (savingsGoals.length)
        await tx.savingsGoal.createMany({
          data: savingsGoals.map((goal: any) => ({
            id: goal.id,
            name: goal.name,
            targetAmount: numberOr(goal.targetAmount),
            currentAmount: numberOr(goal.currentAmount),
            targetDate: new Date(goal.targetDate),
            color: goal.color || "#10B981",
            category: goal.category || "General",
          })),
        });
      if (recurring.length)
        await tx.recurringTransaction.createMany({
          data: recurring.map((item: any) => ({
            id: item.id,
            amount: Math.abs(numberOr(item.amount)),
            type: item.type,
            frequency: item.frequency,
            nextDueDate: new Date(item.nextDueDate),
            description: item.description,
            categoryId: item.categoryId || null,
            accountId: item.accountId,
            isActive: item.isActive !== false,
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
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany();
      await tx.budget.deleteMany();
      await tx.savingsGoal.deleteMany();
      await tx.recurringTransaction.deleteMany();
      await tx.account.deleteMany();
      if (!req.body.keepCategories) await tx.category.deleteMany();
    });
    res.json({
      success: true,
      message: "All requested database records were cleared.",
    });
  } catch (error) {
    sendDatabaseError(res, error, "clear database");
  }
});

async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(__dirname, "dist", "index.html")),
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
    console.log(`AuraLedger server running on http://0.0.0.0:${port}`),
  );
}

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (_req, res) =>
    res.sendFile(path.join(__dirname, "dist", "index.html")),
  );
}

// Export the Express app for Vercel's serverless runtime
export default app;

// Only call app.listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () =>
    console.log(`AuraLedger server running on http://0.0.0.0:${port}`),
  );
}
