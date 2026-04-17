import express, { type NextFunction, type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { chats, helpArticles, messages, profiles, supportTickets, supportUpdates, users, websites } from "../shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 5000);

const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "development-session-secret");

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be configured in production");
}

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/public") || req.path.startsWith("/api/notify")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

type AuthRequest = Request & { userId?: string; userEmail?: string };

function signToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, sessionSecret, { expiresIn: "7d" });
}

function publicUser(user: { id: string; email: string }, displayName?: string | null) {
  return { id: user.id, email: user.email, user_metadata: { display_name: displayName ?? null } };
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    const payload = jwt.verify(token, sessionSecret) as { sub: string; email: string };
    req.userId = payload.sub;
    req.userEmail = payload.email;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

function serializeDate(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function serializeWebsite(row: typeof websites.$inferSelect) {
  return {
    id: row.id,
    owner_id: row.ownerId,
    domain: row.domain,
    name: row.name,
    widget_color: row.widgetColor,
    widget_greeting: row.widgetGreeting,
    is_online: row.isOnline,
    created_at: serializeDate(row.createdAt),
    updated_at: serializeDate(row.updatedAt),
  };
}

function serializeProfile(row: typeof profiles.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    display_name: row.displayName,
    avatar_url: row.avatarUrl,
    company_name: row.companyName,
    created_at: serializeDate(row.createdAt),
    updated_at: serializeDate(row.updatedAt),
  };
}

function serializeChat(row: typeof chats.$inferSelect) {
  return {
    id: row.id,
    website_id: row.websiteId,
    visitor_name: row.visitorName,
    visitor_email: row.visitorEmail,
    visitor_ip: row.visitorIp,
    visitor_location: row.visitorLocation,
    status: row.status,
    started_at: serializeDate(row.startedAt),
    closed_at: serializeDate(row.closedAt),
    updated_at: serializeDate(row.updatedAt),
  };
}

function serializeMessage(row: typeof messages.$inferSelect) {
  return {
    id: row.id,
    chat_id: row.chatId,
    sender: row.sender,
    content: row.content,
    created_at: serializeDate(row.createdAt),
  };
}

async function getOwnedWebsite(ownerId: string, websiteId: string) {
  const [site] = await db.select().from(websites).where(and(eq(websites.id, websiteId), eq(websites.ownerId, ownerId))).limit(1);
  return site;
}

async function getOwnedChat(ownerId: string, chatId: string) {
  const [chat] = await db
    .select({ chat: chats })
    .from(chats)
    .innerJoin(websites, eq(chats.websiteId, websites.id))
    .where(and(eq(chats.id, chatId), eq(websites.ownerId, ownerId)))
    .limit(1);
  return chat?.chat;
}

async function sendNotification(chatId: string, messageContent: string, visitorName?: string | null) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const [result] = await db
    .select({ chat: chats, website: websites, owner: users })
    .from(chats)
    .innerJoin(websites, eq(chats.websiteId, websites.id))
    .innerJoin(users, eq(websites.ownerId, users.id))
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!result) return { success: false, error: "Chat not found" };

  const senderName = visitorName || result.chat.visitorName || "A visitor";
  const siteName = result.website.name || "your website";
  const origin = process.env.PUBLIC_APP_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AfuDesk <notifications@afuchat.com>",
      to: [result.owner.email],
      subject: `New message from ${senderName} on ${siteName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>New Message</h2><p>${senderName} sent a message on <strong>${siteName}</strong>.</p><blockquote style="border-left:4px solid #00C2CB;padding-left:12px">${messageContent}</blockquote><p><a href="${origin}/dashboard/chats">Reply in dashboard</a></p></div>`,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { success: false, error: data };
  return { success: true, id: data.id };
}

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const displayName = String(req.body.displayName || "").trim() || email.split("@")[0];

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "A valid email and password of at least 6 characters are required" });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const [created] = await db.insert(users).values({ email, passwordHash }).returning();
    await db.insert(profiles).values({ userId: created.id, displayName });

    const user = publicUser(created, displayName);
    res.status(201).json({ token: signToken(created), user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    res.json({ token: signToken(user), user: publicUser(user, profile?.displayName) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1);
    if (!user) return res.status(401).json({ error: "User not found" });
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    const token = req.headers.authorization!.slice(7);
    const safeUser = publicUser(user, profile?.displayName);
    res.json({ user: safeUser, session: { access_token: token, user: safeUser } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/profile", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, req.userId!)).limit(1);
    res.json(profile ? serializeProfile(profile) : null);
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [profile] = await db
      .update(profiles)
      .set({ displayName: String(req.body.display_name || "").trim(), companyName: String(req.body.company_name || "").trim(), updatedAt: new Date() })
      .where(eq(profiles.userId, req.userId!))
      .returning();
    res.json(serializeProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.get("/api/websites", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const rows = await db.select().from(websites).where(eq(websites.ownerId, req.userId!)).orderBy(desc(websites.createdAt));
    res.json(rows.map(serializeWebsite));
  } catch (error) {
    next(error);
  }
});

app.post("/api/websites", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const domain = String(req.body.domain || "").trim();
    if (!name || !domain) return res.status(400).json({ error: "Website name and domain are required" });
    const [site] = await db.insert(websites).values({ ownerId: req.userId!, name, domain }).returning();
    res.status(201).json(serializeWebsite(site));
  } catch (error) {
    next(error);
  }
});

app.delete("/api/websites/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const site = await getOwnedWebsite(req.userId!, req.params.id);
    if (!site) return res.status(404).json({ error: "Website not found" });
    await db.delete(websites).where(eq(websites.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard/stats", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ownedSites = await db.select({ id: websites.id }).from(websites).where(eq(websites.ownerId, req.userId!));
    const websiteIds = ownedSites.map((site) => site.id);
    if (!websiteIds.length) return res.json({ totalWebsites: 0, totalChats: 0, openChats: 0, totalMessages: 0 });

    const [chatCount] = await db.select({ value: sql<number>`count(*)` }).from(chats).where(inArray(chats.websiteId, websiteIds));
    const [openCount] = await db.select({ value: sql<number>`count(*)` }).from(chats).where(and(inArray(chats.websiteId, websiteIds), eq(chats.status, "open")));
    const chatRows = await db.select({ id: chats.id }).from(chats).where(inArray(chats.websiteId, websiteIds));
    const chatIds = chatRows.map((chat) => chat.id);
    const [messageCount] = chatIds.length
      ? await db.select({ value: sql<number>`count(*)` }).from(messages).where(inArray(messages.chatId, chatIds))
      : [{ value: 0 }];

    res.json({
      totalWebsites: ownedSites.length,
      totalChats: Number(chatCount.value),
      openChats: Number(openCount.value),
      totalMessages: Number(messageCount.value),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/chats", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const rows = await db
      .select({ chat: chats, websiteName: websites.name })
      .from(chats)
      .innerJoin(websites, eq(chats.websiteId, websites.id))
      .where(eq(websites.ownerId, req.userId!))
      .orderBy(desc(chats.updatedAt));

    const enriched = await Promise.all(rows.map(async ({ chat, websiteName }) => {
      const [last] = await db.select().from(messages).where(eq(messages.chatId, chat.id)).orderBy(desc(messages.createdAt)).limit(1);
      return { ...serializeChat(chat), website_name: websiteName, last_message: last?.content ?? "" };
    }));

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

app.get("/api/chats/:id/messages", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chat = await getOwnedChat(req.userId!, req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const rows = await db.select().from(messages).where(eq(messages.chatId, req.params.id)).orderBy(asc(messages.createdAt));
    res.json(rows.map(serializeMessage));
  } catch (error) {
    next(error);
  }
});

app.post("/api/chats/:id/messages", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chat = await getOwnedChat(req.userId!, req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ error: "Message content is required" });
    const [message] = await db.insert(messages).values({ chatId: req.params.id, sender: "agent", content }).returning();
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, req.params.id));
    res.status(201).json(serializeMessage(message));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/chats/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const chat = await getOwnedChat(req.userId!, req.params.id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const status = req.body.status === "closed" ? "closed" : "open";
    const [updated] = await db
      .update(chats)
      .set({ status, closedAt: status === "closed" ? new Date() : null, updatedAt: new Date() })
      .where(eq(chats.id, req.params.id))
      .returning();
    res.json(serializeChat(updated));
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/websites/:id", async (req, res, next) => {
  try {
    const [site] = await db.select().from(websites).where(eq(websites.id, req.params.id)).limit(1);
    if (!site) return res.status(404).json({ error: "Website not found" });
    res.json({ name: site.name, widget_color: site.widgetColor, widget_greeting: site.widgetGreeting, is_online: site.isOnline });
  } catch (error) {
    next(error);
  }
});

app.post("/api/public/chats", async (req, res, next) => {
  try {
    const websiteId = String(req.body.website_id || "");
    const [site] = await db.select().from(websites).where(eq(websites.id, websiteId)).limit(1);
    if (!site) return res.status(404).json({ error: "Website not found" });
    const [chat] = await db.insert(chats).values({
      websiteId,
      visitorName: req.body.visitor_name || null,
      visitorEmail: req.body.visitor_email || null,
      visitorIp: req.ip,
      status: "open",
    }).returning();
    res.status(201).json(serializeChat(chat));
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/chats/:id/messages", async (req, res, next) => {
  try {
    const rows = await db.select().from(messages).where(eq(messages.chatId, req.params.id)).orderBy(asc(messages.createdAt));
    res.json(rows.map(serializeMessage));
  } catch (error) {
    next(error);
  }
});

app.post("/api/public/messages", async (req, res, next) => {
  try {
    const chatId = String(req.body.chat_id || "");
    const content = String(req.body.content || "").trim();
    if (!chatId || !content) return res.status(400).json({ error: "chat_id and content are required" });
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const [message] = await db.insert(messages).values({ chatId, sender: "visitor", content }).returning();
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId));
    await sendNotification(chatId, content, chat.visitorName).catch((error) => console.error("Notification failed", error));
    res.status(201).json(serializeMessage(message));
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/help-articles", async (req, res, next) => {
  try {
    const websiteId = String(req.query.website_id || "");
    const rows = await db.select().from(helpArticles).where(and(eq(helpArticles.websiteId, websiteId), eq(helpArticles.isPublished, true))).orderBy(asc(helpArticles.sortOrder));
    res.json(rows.map((row) => ({ id: row.id, title: row.title, excerpt: row.excerpt, category: row.category, content: row.content })));
  } catch (error) {
    next(error);
  }
});

app.post("/api/public/support-tickets", async (req, res, next) => {
  try {
    const websiteId = String(req.body.website_id || "");
    const visitorName = String(req.body.visitor_name || "").trim();
    const subject = String(req.body.subject || "").trim();
    const description = String(req.body.description || "").trim();
    if (!websiteId || !visitorName || !subject || !description) return res.status(400).json({ error: "Missing required ticket fields" });
    const [ticket] = await db.insert(supportTickets).values({
      websiteId,
      visitorName,
      visitorEmail: req.body.visitor_email || null,
      subject,
      priority: req.body.priority || "medium",
      description,
    }).returning();
    res.status(201).json({ id: ticket.id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/support-updates", async (req, res, next) => {
  try {
    const websiteId = String(req.query.website_id || "");
    const rows = await db.select().from(supportUpdates).where(and(eq(supportUpdates.websiteId, websiteId), eq(supportUpdates.isPublished, true))).orderBy(desc(supportUpdates.publishedAt));
    res.json(rows.map((row) => ({ id: row.id, title: row.title, summary: row.summary, label: row.label, published_at: serializeDate(row.publishedAt), content: row.content })));
  } catch (error) {
    next(error);
  }
});

app.post("/api/notify-new-message", async (req, res, next) => {
  try {
    const result = await sendNotification(String(req.body.chat_id || ""), String(req.body.message_content || ""), req.body.visitor_name || null);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ error: message });
});

if (process.env.NODE_ENV === "production") {
  const publicDir = __dirname;
  app.use(express.static(publicDir));
  app.use((_req, res) => res.sendFile(path.join(publicDir, "index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, host: "0.0.0.0", allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`AfuDesk running on port ${port}`);
});
