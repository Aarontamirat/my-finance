import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Prisma Client
let prisma: PrismaClient | null = null;
let isDbConnected = false;
let dbError: string | null = null;

if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
  } catch (err: any) {
    dbError = err.message;
  }
} else {
  dbError = 'DATABASE_URL environment variable is not defined in .env.';
}

// In-memory runtime cache for seamless operation if DB credentials are pending
let inMemoryAccounts: any[] = [];
let inMemoryCategories: any[] = [
  { id: 'cat-housing', name: 'Housing & Rent', type: 'EXPENSE', icon: 'Home', color: '#6366F1' },
  { id: 'cat-groceries', name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingCart', color: '#10B981' },
  { id: 'cat-dining', name: 'Dining & Drinks', type: 'EXPENSE', icon: 'Utensils', color: '#F59E0B' },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'EXPENSE', icon: 'Zap', color: '#EC4899' },
  { id: 'cat-transport', name: 'Transport & Fuel', type: 'EXPENSE', icon: 'Car', color: '#3B82F6' },
  { id: 'cat-subscriptions', name: 'Subscriptions', type: 'EXPENSE', icon: 'Tv', color: '#8B5CF6' },
  { id: 'cat-shopping', name: 'Shopping & Gear', type: 'EXPENSE', icon: 'ShoppingBag', color: '#14B8A6' },
  { id: 'cat-health', name: 'Health & Fitness', type: 'EXPENSE', icon: 'HeartPulse', color: '#EF4444' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#F97316' },
  { id: 'cat-education', name: 'Education & Books', type: 'EXPENSE', icon: 'BookOpen', color: '#06B6D4' },
  { id: 'cat-travel', name: 'Travel & Vacations', type: 'EXPENSE', icon: 'Plane', color: '#84CC16' },
  { id: 'cat-salary', name: 'Primary Salary', type: 'INCOME', icon: 'Briefcase', color: '#10B981' },
  { id: 'cat-freelance', name: 'Freelance & Side Gig', type: 'INCOME', icon: 'Laptop', color: '#3B82F6' },
  { id: 'cat-investments', name: 'Dividends & Interest', type: 'INCOME', icon: 'TrendingUp', color: '#8B5CF6' },
  { id: 'cat-refunds', name: 'Refunds & Gifts', type: 'INCOME', icon: 'Gift', color: '#EC4899' },
];
let inMemoryTransactions: any[] = [];
let inMemoryBudgets: any[] = [];
let inMemoryGoals: any[] = [];
let inMemoryRecurring: any[] = [];

// Health / Database Connection Check
app.get('/api/health', async (_req: Request, res: Response) => {
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isDbConnected = true;
      dbError = null;
      return res.json({
        connected: true,
        engine: 'Neon PostgreSQL (Prisma)',
        databaseUrlConfigured: true,
      });
    } catch (err: any) {
      isDbConnected = false;
      dbError = err.message;
      return res.json({
        connected: false,
        engine: 'Neon PostgreSQL (Error)',
        databaseUrlConfigured: true,
        error: err.message,
      });
    }
  }

  return res.json({
    connected: false,
    engine: 'Prisma Client Ready (Awaiting DATABASE_URL in .env)',
    databaseUrlConfigured: false,
    error: dbError,
  });
});

// ACCOUNTS
app.get('/api/accounts', async (_req: Request, res: Response) => {
  if (prisma && isDbConnected) {
    try {
      const accounts = await prisma.account.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.json(accounts);
    } catch (err: any) {
      console.error('Prisma accounts error:', err);
    }
  }
  return res.json(inMemoryAccounts);
});

app.post('/api/accounts', async (req: Request, res: Response) => {
  const { name, type, balance, currency, color, isDefault } = req.body;
  const newAccount = {
    id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name || 'Account',
    type: type || 'BANK',
    balance: Number(balance) || 0,
    currency: currency || 'USD',
    color: color || '#10B981',
    isDefault: Boolean(isDefault),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (prisma && isDbConnected) {
    try {
      const created = await prisma.account.create({
        data: {
          name: newAccount.name,
          type: newAccount.type as any,
          balance: newAccount.balance,
          currency: newAccount.currency,
          color: newAccount.color,
          isDefault: newAccount.isDefault,
        },
      });
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('Prisma create account error:', err);
    }
  }

  inMemoryAccounts.push(newAccount);
  return res.status(201).json(newAccount);
});

app.put('/api/accounts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  if (prisma && isDbConnected) {
    try {
      const updated = await prisma.account.update({
        where: { id },
        data: {
          ...data,
          balance: data.balance !== undefined ? Number(data.balance) : undefined,
          updatedAt: new Date(),
        },
      });
      return res.json(updated);
    } catch (err: any) {
      console.error('Prisma update account error:', err);
    }
  }

  const idx = inMemoryAccounts.findIndex((a) => a.id === id);
  if (idx !== -1) {
    inMemoryAccounts[idx] = { ...inMemoryAccounts[idx], ...data, updatedAt: new Date().toISOString() };
    return res.json(inMemoryAccounts[idx]);
  }
  return res.status(404).json({ error: 'Account not found' });
});

app.delete('/api/accounts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (prisma && isDbConnected) {
    try {
      await prisma.account.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Prisma delete account error:', err);
    }
  }

  inMemoryAccounts = inMemoryAccounts.filter((a) => a.id !== id);
  inMemoryTransactions = inMemoryTransactions.filter((t) => t.accountId !== id);
  return res.json({ success: true });
});

// CATEGORIES
app.get('/api/categories', async (_req: Request, res: Response) => {
  if (prisma && isDbConnected) {
    try {
      const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
      if (cats.length > 0) return res.json(cats);
    } catch (err: any) {
      console.error('Prisma categories error:', err);
    }
  }
  return res.json(inMemoryCategories);
});

app.post('/api/categories', async (req: Request, res: Response) => {
  const { name, type, icon, color } = req.body;
  const newCat = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    type: type || 'EXPENSE',
    icon: icon || 'tag',
    color: color || '#6366F1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (prisma && isDbConnected) {
    try {
      const created = await prisma.category.create({
        data: {
          name: newCat.name,
          type: newCat.type as any,
          icon: newCat.icon,
          color: newCat.color,
        },
      });
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('Prisma create category error:', err);
    }
  }

  inMemoryCategories.push(newCat);
  return res.status(201).json(newCat);
});

// TRANSACTIONS
app.get('/api/transactions', async (_req: Request, res: Response) => {
  if (prisma && isDbConnected) {
    try {
      const txs = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
      });
      return res.json(txs);
    } catch (err: any) {
      console.error('Prisma transactions error:', err);
    }
  }
  return res.json(inMemoryTransactions);
});

app.post('/api/transactions', async (req: Request, res: Response) => {
  const { amount, type, date, description, categoryId, accountId, toAccountId, isRecurring, notes, tags } = req.body;
  const numAmount = Math.abs(Number(amount));

  const newTx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    amount: numAmount,
    type: type || 'EXPENSE',
    date: date || new Date().toISOString().split('T')[0],
    description: description || 'Transaction',
    categoryId: categoryId || null,
    accountId,
    toAccountId: toAccountId || null,
    isRecurring: Boolean(isRecurring),
    notes: notes || '',
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (prisma && isDbConnected) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const record = await tx.transaction.create({
          data: {
            amount: newTx.amount,
            type: newTx.type as any,
            date: new Date(newTx.date),
            description: newTx.description,
            categoryId: newTx.categoryId || undefined,
            accountId: newTx.accountId,
            toAccountId: newTx.toAccountId || undefined,
            isRecurring: newTx.isRecurring,
            notes: newTx.notes,
            tags: newTx.tags,
          },
        });

        // Update balance
        if (newTx.type === 'INCOME') {
          await tx.account.update({
            where: { id: newTx.accountId },
            data: { balance: { increment: newTx.amount } },
          });
        } else if (newTx.type === 'EXPENSE') {
          await tx.account.update({
            where: { id: newTx.accountId },
            data: { balance: { decrement: newTx.amount } },
          });
        } else if (newTx.type === 'TRANSFER' && newTx.toAccountId) {
          await tx.account.update({
            where: { id: newTx.accountId },
            data: { balance: { decrement: newTx.amount } },
          });
          await tx.account.update({
            where: { id: newTx.toAccountId },
            data: { balance: { increment: newTx.amount } },
          });
        }
        return record;
      });

      return res.status(201).json(created);
    } catch (err: any) {
      console.error('Prisma create transaction error:', err);
    }
  }

  // Update in-memory
  const acc = inMemoryAccounts.find((a) => a.id === accountId);
  if (acc) {
    if (newTx.type === 'INCOME') acc.balance += numAmount;
    if (newTx.type === 'EXPENSE') acc.balance -= numAmount;
    if (newTx.type === 'TRANSFER') {
      acc.balance -= numAmount;
      const targetAcc = inMemoryAccounts.find((a) => a.id === toAccountId);
      if (targetAcc) targetAcc.balance += numAmount;
    }
  }

  inMemoryTransactions.unshift(newTx);
  return res.status(201).json(newTx);
});

app.delete('/api/transactions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (prisma && isDbConnected) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.transaction.findUnique({ where: { id } });
        if (existing) {
          if (existing.type === 'INCOME') {
            await tx.account.update({
              where: { id: existing.accountId },
              data: { balance: { decrement: existing.amount } },
            });
          } else if (existing.type === 'EXPENSE') {
            await tx.account.update({
              where: { id: existing.accountId },
              data: { balance: { increment: existing.amount } },
            });
          } else if (existing.type === 'TRANSFER' && existing.toAccountId) {
            await tx.account.update({
              where: { id: existing.accountId },
              data: { balance: { increment: existing.amount } },
            });
            await tx.account.update({
              where: { id: existing.toAccountId },
              data: { balance: { decrement: existing.amount } },
            });
          }
          await tx.transaction.delete({ where: { id } });
        }
      });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Prisma delete transaction error:', err);
    }
  }

  const existing = inMemoryTransactions.find((t) => t.id === id);
  if (existing) {
    const acc = inMemoryAccounts.find((a) => a.id === existing.accountId);
    if (acc) {
      if (existing.type === 'INCOME') acc.balance -= existing.amount;
      if (existing.type === 'EXPENSE') acc.balance += existing.amount;
      if (existing.type === 'TRANSFER' && existing.toAccountId) {
        acc.balance += existing.amount;
        const targetAcc = inMemoryAccounts.find((a) => a.id === existing.toAccountId);
        if (targetAcc) targetAcc.balance -= existing.amount;
      }
    }
    inMemoryTransactions = inMemoryTransactions.filter((t) => t.id !== id);
  }
  return res.json({ success: true });
});

// BUDGETS
app.get('/api/budgets', async (_req: Request, res: Response) => {
  if (prisma && isDbConnected) {
    try {
      const budgets = await prisma.budget.findMany();
      return res.json(budgets);
    } catch (err: any) {
      console.error('Prisma budgets error:', err);
    }
  }
  return res.json(inMemoryBudgets);
});

app.post('/api/budgets', async (req: Request, res: Response) => {
  const { categoryId, amountLimit, month, year } = req.body;

  if (prisma && isDbConnected) {
    try {
      const upserted = await prisma.budget.upsert({
        where: {
          categoryId_month_year: {
            categoryId,
            month: Number(month),
            year: Number(year),
          },
        },
        update: { amountLimit: Number(amountLimit) },
        create: {
          categoryId,
          amountLimit: Number(amountLimit),
          month: Number(month),
          year: Number(year),
        },
      });
      return res.json(upserted);
    } catch (err: any) {
      console.error('Prisma budget upsert error:', err);
    }
  }

  const existingIdx = inMemoryBudgets.findIndex(
    (b) => b.categoryId === categoryId && b.month === month && b.year === year
  );
  if (existingIdx !== -1) {
    inMemoryBudgets[existingIdx].amountLimit = Number(amountLimit);
    return res.json(inMemoryBudgets[existingIdx]);
  }
  const newBudget = {
    id: `bgt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    categoryId,
    amountLimit: Number(amountLimit),
    month: Number(month),
    year: Number(year),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  inMemoryBudgets.push(newBudget);
  return res.json(newBudget);
});

app.delete('/api/budgets/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (prisma && isDbConnected) {
    try {
      await prisma.budget.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Prisma delete budget error:', err);
    }
  }
  inMemoryBudgets = inMemoryBudgets.filter((b) => b.id !== id);
  return res.json({ success: true });
});

// SAVINGS GOALS
app.get('/api/savings-goals', async (_req: Request, res: Response) => {
  if (prisma && isDbConnected) {
    try {
      const goals = await prisma.savingsGoal.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json(goals);
    } catch (err: any) {
      console.error('Prisma goals error:', err);
    }
  }
  return res.json(inMemoryGoals);
});

app.post('/api/savings-goals', async (req: Request, res: Response) => {
  const { name, targetAmount, currentAmount, targetDate, color, category } = req.body;
  const newGoal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    targetAmount: Number(targetAmount) || 0,
    currentAmount: Number(currentAmount) || 0,
    targetDate: targetDate || new Date().toISOString().split('T')[0],
    color: color || '#10B981',
    category: category || 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (prisma && isDbConnected) {
    try {
      const created = await prisma.savingsGoal.create({
        data: {
          name: newGoal.name,
          targetAmount: newGoal.targetAmount,
          currentAmount: newGoal.currentAmount,
          targetDate: new Date(newGoal.targetDate),
          color: newGoal.color,
          category: newGoal.category,
        },
      });
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('Prisma create goal error:', err);
    }
  }

  inMemoryGoals.push(newGoal);
  return res.status(201).json(newGoal);
});

app.put('/api/savings-goals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  if (prisma && isDbConnected) {
    try {
      const updated = await prisma.savingsGoal.update({
        where: { id },
        data: {
          ...data,
          targetAmount: data.targetAmount !== undefined ? Number(data.targetAmount) : undefined,
          currentAmount: data.currentAmount !== undefined ? Number(data.currentAmount) : undefined,
          targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
          updatedAt: new Date(),
        },
      });
      return res.json(updated);
    } catch (err: any) {
      console.error('Prisma update goal error:', err);
    }
  }

  const idx = inMemoryGoals.findIndex((g) => g.id === id);
  if (idx !== -1) {
    inMemoryGoals[idx] = { ...inMemoryGoals[idx], ...data, updatedAt: new Date().toISOString() };
    return res.json(inMemoryGoals[idx]);
  }
  return res.status(404).json({ error: 'Goal not found' });
});

app.delete('/api/savings-goals/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (prisma && isDbConnected) {
    try {
      await prisma.savingsGoal.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Prisma delete goal error:', err);
    }
  }
  inMemoryGoals = inMemoryGoals.filter((g) => g.id !== id);
  return res.json({ success: true });
});

// RECURRING TRANSACTIONS
app.get('/api/recurring', async (_req: Request, res: Response) => {
  if (prisma && isDbConnected) {
    try {
      const recurring = await prisma.recurringTransaction.findMany({ orderBy: { nextDueDate: 'asc' } });
      return res.json(recurring);
    } catch (err: any) {
      console.error('Prisma recurring error:', err);
    }
  }
  return res.json(inMemoryRecurring);
});

app.post('/api/recurring', async (req: Request, res: Response) => {
  const { amount, type, frequency, nextDueDate, description, categoryId, accountId, isActive } = req.body;
  const newRec = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    amount: Number(amount) || 0,
    type: type || 'EXPENSE',
    frequency: frequency || 'MONTHLY',
    nextDueDate: nextDueDate || new Date().toISOString().split('T')[0],
    description,
    categoryId: categoryId || null,
    accountId,
    isActive: isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (prisma && isDbConnected) {
    try {
      const created = await prisma.recurringTransaction.create({
        data: {
          amount: newRec.amount,
          type: newRec.type as any,
          frequency: newRec.frequency as any,
          nextDueDate: new Date(newRec.nextDueDate),
          description: newRec.description,
          categoryId: newRec.categoryId || undefined,
          accountId: newRec.accountId,
          isActive: newRec.isActive,
        },
      });
      return res.status(201).json(created);
    } catch (err: any) {
      console.error('Prisma create recurring error:', err);
    }
  }

  inMemoryRecurring.push(newRec);
  return res.status(201).json(newRec);
});

app.delete('/api/recurring/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (prisma && isDbConnected) {
    try {
      await prisma.recurringTransaction.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Prisma delete recurring error:', err);
    }
  }
  inMemoryRecurring = inMemoryRecurring.filter((r) => r.id !== id);
  return res.json({ success: true });
});

// RESET OR CLEAR ALL DATA
app.post('/api/database/clear-all', async (req: Request, res: Response) => {
  const { keepCategories } = req.body;

  if (prisma && isDbConnected) {
    try {
      await prisma.transaction.deleteMany();
      await prisma.budget.deleteMany();
      await prisma.savingsGoal.deleteMany();
      await prisma.recurringTransaction.deleteMany();
      await prisma.account.deleteMany();
      if (!keepCategories) {
        await prisma.category.deleteMany();
      }
      return res.json({ success: true, message: 'All database tables wiped' });
    } catch (err: any) {
      console.error('Prisma clear all error:', err);
    }
  }

  inMemoryAccounts = [];
  inMemoryTransactions = [];
  inMemoryBudgets = [];
  inMemoryGoals = [];
  inMemoryRecurring = [];
  if (!keepCategories) {
    inMemoryCategories = [];
  }
  return res.json({ success: true, message: 'Clean slate established' });
});

// Vite middleware integration (Full-stack configuration)
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AuraLedger full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
