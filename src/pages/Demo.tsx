import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  LifeBuoy,
  Mail,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Search,
  Send,
  Sparkles,
  TicketPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type TabKey = "home" | "help" | "messages" | "news";

interface WebsiteConfig {
  id: string;
  name: string;
  widget_greeting: string | null;
  widget_color: string | null;
}

interface HelpArticle {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
}

interface SupportUpdate {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  label: string | null;
  published_at: string;
}

interface ChatRow {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: string;
}

interface MessageRow {
  id: string;
  content: string;
  sender: string;
  created_at: string;
}

const tabs: Array<{ key: TabKey; label: string; icon: typeof LifeBuoy }> = [
  { key: "home", label: "Home", icon: LifeBuoy },
  { key: "help", label: "Help", icon: Search },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "news", label: "News", icon: Newspaper },
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function Demo() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [website, setWebsite] = useState<WebsiteConfig | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [updates, setUpdates] = useState<SupportUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpQuery, setHelpQuery] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatName, setChatName] = useState("");
  const [chatEmail, setChatEmail] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [chatReady, setChatReady] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const requestedSiteId = searchParams.get("site_id");

  useEffect(() => {
    const bootstrap = async () => {
      const websiteQuery = (supabase as any)
        .from("websites")
        .select("id, name, widget_greeting, widget_color")
        .limit(1);

      const { data: siteData, error: siteError } = requestedSiteId
        ? await websiteQuery.eq("id", requestedSiteId).maybeSingle()
        : await websiteQuery.order("created_at", { ascending: true }).maybeSingle();

      if (siteError || !siteData) {
        setLoading(false);
        return;
      }

      setWebsite(siteData);

      const storedChatId = window.localStorage.getItem(`afudesk-demo-chat-${siteData.id}`);
      if (storedChatId) {
        setChatId(storedChatId);
        setChatReady(true);
      }

      const [{ data: articleRows }, { data: updateRows }] = await Promise.all([
        (supabase as any)
          .from("help_articles")
          .select("id, title, excerpt, content, category")
          .eq("website_id", siteData.id)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
        (supabase as any)
          .from("support_updates")
          .select("id, title, summary, content, label, published_at")
          .eq("website_id", siteData.id)
          .eq("is_published", true)
          .order("published_at", { ascending: false }),
      ]);

      setArticles(articleRows ?? []);
      setUpdates(updateRows ?? []);
      setLoading(false);
    };

    bootstrap();
  }, [requestedSiteId]);

  useEffect(() => {
    if (!chatId) return;

    const loadMessages = async () => {
      const { data: chatRows } = await (supabase as any)
        .from("chats")
        .select("id, visitor_name, visitor_email, status")
        .eq("id", chatId)
        .limit(1);

      const chat = (chatRows as ChatRow[] | null)?.[0];
      if (!chat) {
        setChatId(null);
        setChatReady(false);
        setMessages([]);
        if (website) {
          window.localStorage.removeItem(`afudesk-demo-chat-${website.id}`);
        }
        return;
      }

      setChatName(chat.visitor_name ?? "");
      setChatEmail(chat.visitor_email ?? "");
      setChatReady(true);

      const { data: messageRows } = await (supabase as any)
        .from("messages")
        .select("id, content, sender, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      setMessages(messageRows ?? []);
    };

    loadMessages();
    const interval = window.setInterval(loadMessages, 3000);
    return () => window.clearInterval(interval);
  }, [chatId, website]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredArticles = useMemo(() => {
    const query = helpQuery.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter((article) =>
      [article.title, article.excerpt, article.content, article.category]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [articles, helpQuery]);

  const startChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!website || !chatName.trim()) return;

    const { data, error } = await (supabase as any)
      .from("chats")
      .insert({
        website_id: website.id,
        visitor_name: chatName.trim(),
        visitor_email: chatEmail.trim() || null,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      toast({ title: "Could not start chat", description: error?.message, variant: "destructive" });
      return;
    }

    window.localStorage.setItem(`afudesk-demo-chat-${website.id}`, data.id);
    setChatId(data.id);
    setChatReady(true);
    toast({ title: "Chat started", description: "You can now send messages." });
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatId || !chatInput.trim()) return;

    setSendingMessage(true);
    const { error } = await (supabase as any).from("messages").insert({
      chat_id: chatId,
      sender: "visitor",
      content: chatInput.trim(),
    });

    if (error) {
      toast({ title: "Could not send message", description: error.message, variant: "destructive" });
    } else {
      setChatInput("");
      const { data: messageRows } = await (supabase as any)
        .from("messages")
        .select("id, content, sender, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      setMessages(messageRows ?? []);
    }
    setSendingMessage(false);
  };

  const submitTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!website) return;
    setTicketSubmitting(true);

    const { error } = await (supabase as any).from("support_tickets").insert({
      website_id: website.id,
      visitor_name: ticketName.trim(),
      visitor_email: ticketEmail.trim() || null,
      subject: ticketSubject.trim(),
      description: ticketDescription.trim(),
      status: "open",
      priority: "normal",
    });

    if (error) {
      toast({ title: "Ticket failed", description: error.message, variant: "destructive" });
    } else {
      setTicketName("");
      setTicketEmail("");
      setTicketSubject("");
      setTicketDescription("");
      toast({ title: "Ticket created", description: "Your request was sent successfully." });
      setActiveTab("messages");
    }

    setTicketSubmitting(false);
  };

  const featuredArticles = filteredArticles.slice(0, 4);
  const recentUpdates = updates.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background md:max-w-6xl md:flex-row md:gap-10 md:px-8 md:py-8">
        <section className="relative overflow-hidden bg-primary px-6 pb-8 pt-6 text-primary-foreground md:min-h-[760px] md:w-[420px] md:rounded-[2rem] md:px-8 md:pb-10 md:pt-8">
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-primary via-primary/70 to-background/0" />
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary-foreground">
              <ArrowLeft className="h-4 w-4" /> AfuDesk
            </Link>
            <div className="flex -space-x-3">
              {["A", "F", "U"].map((letter) => (
                <div key={letter} className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-sm font-bold text-foreground">
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-16 md:pt-20">
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-primary-foreground/70">Support center</p>
            <h1 className="max-w-xs text-5xl font-extrabold leading-none tracking-tight">
              Hello {website?.name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="mt-5 max-w-sm text-base text-primary-foreground/80">
              {website?.widget_greeting ?? "How can we help you today? Browse help, open a ticket, or start a live conversation."}
            </p>
          </div>

          <div className="relative z-10 mt-10 space-y-4 md:mt-12">
            <div className="rounded-[1.75rem] bg-background p-5 text-foreground">
              <div className="mb-5 flex items-center gap-3 text-sm font-semibold">
                <TicketPlus className="h-5 w-5 text-primary" /> Create a ticket
              </div>
              <form className="space-y-3" onSubmit={submitTicket}>
                <Input value={ticketName} onChange={(e) => setTicketName(e.target.value)} placeholder="Your name" required />
                <Input value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)} placeholder="Your email" type="email" />
                <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Subject" required />
                <Textarea
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Tell us what you need"
                  className="min-h-24"
                  required
                />
                <Button type="submit" className="w-full" disabled={ticketSubmitting || !website}>
                  {ticketSubmitting ? "Sending..." : "Create ticket"}
                </Button>
              </form>
            </div>

            <div className="rounded-[1.75rem] bg-background p-5 text-foreground">
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold">
                <Search className="h-5 w-5 text-primary" /> Search for help
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={helpQuery}
                  onChange={(e) => {
                    setHelpQuery(e.target.value);
                    setActiveTab("help");
                  }}
                  placeholder="Search articles"
                  className="pl-9"
                />
              </div>
              <div className="mt-4 space-y-3">
                {featuredArticles.length > 0 ? (
                  featuredArticles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setActiveTab("help")}
                      className="flex w-full items-center justify-between rounded-2xl bg-muted px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{article.title}</p>
                        {article.category ? <p className="text-xs text-muted-foreground">{article.category}</p> : null}
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No help articles available yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-background p-5 text-foreground">
              <div className="mb-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Update
              </div>
              {recentUpdates[0] ? (
                <button type="button" onClick={() => setActiveTab("news")} className="w-full text-left">
                  <p className="text-xl font-bold leading-tight">{recentUpdates[0].title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{recentUpdates[0].summary}</p>
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">No updates published yet.</p>
              )}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 bg-background px-4 py-3 md:absolute md:inset-x-6 md:bottom-6 md:rounded-full">
            <div className="grid grid-cols-4 gap-2 rounded-full bg-background md:bg-muted/30">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-col items-center gap-1 rounded-full px-2 py-3 text-xs font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex-1 px-5 pb-28 pt-6 md:px-0 md:pb-6 md:pt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-[1.75rem] bg-card" />
              ))}
            </div>
          ) : activeTab === "home" ? (
            <div className="space-y-6">
              <div className="rounded-[2rem] bg-card p-6">
                <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                  <Sparkles className="h-5 w-5" /> Quick actions
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    { title: "Open a ticket", desc: "Send a detailed support request.", tab: "home", icon: TicketPlus },
                    { title: "Browse help", desc: "Search the knowledge base.", tab: "help", icon: Search },
                    { title: "Start messaging", desc: "Chat with the support team.", tab: "messages", icon: MessageCircle },
                  ].map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActiveTab(item.tab as TabKey)}
                      className="rounded-[1.5rem] bg-muted p-5 text-left"
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <p className="mt-4 font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Popular help articles</h2>
                    <Button variant="ghost" onClick={() => setActiveTab("help")}>View all</Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {articles.slice(0, 5).map((article) => (
                      <div key={article.id} className="rounded-[1.25rem] bg-muted px-4 py-4">
                        <p className="font-semibold">{article.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] bg-card p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Bell className="h-4 w-4" /> Latest updates
                  </div>
                  <div className="mt-4 space-y-3">
                    {updates.slice(0, 3).map((update) => (
                      <button
                        key={update.id}
                        type="button"
                        onClick={() => setActiveTab("news")}
                        className="w-full rounded-[1.25rem] bg-muted px-4 py-4 text-left"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-primary">{update.label ?? "Update"}</p>
                        <p className="mt-2 font-semibold">{update.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{update.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "help" ? (
            <div className="rounded-[2rem] bg-card p-6">
              <div className="flex items-center gap-3">
                <LifeBuoy className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">Help articles</h2>
                  <p className="text-sm text-muted-foreground">Search and browse published support content.</p>
                </div>
              </div>
              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={helpQuery} onChange={(e) => setHelpQuery(e.target.value)} placeholder="Search help center" className="pl-9" />
              </div>
              <div className="mt-6 space-y-4">
                {filteredArticles.map((article) => (
                  <article key={article.id} className="rounded-[1.5rem] bg-muted p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        {article.category ? <p className="text-xs uppercase tracking-[0.2em] text-primary">{article.category}</p> : null}
                        <h3 className="mt-2 text-lg font-bold">{article.title}</h3>
                      </div>
                    </div>
                    {article.excerpt ? <p className="mt-3 text-sm text-muted-foreground">{article.excerpt}</p> : null}
                    {article.content ? <p className="mt-4 text-sm leading-6 text-foreground/90">{article.content}</p> : null}
                  </article>
                ))}
                {filteredArticles.length === 0 ? <p className="text-sm text-muted-foreground">No articles match your search.</p> : null}
              </div>
            </div>
          ) : activeTab === "messages" ? (
            <div className="rounded-[2rem] bg-card p-4 md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">Messages</h2>
                  <p className="text-sm text-muted-foreground">This is connected to the live backend chat tables.</p>
                </div>
              </div>

              {!chatReady ? (
                <form onSubmit={startChat} className="space-y-4 rounded-[1.5rem] bg-muted p-5">
                  <p className="text-sm text-muted-foreground">Start a conversation to create a real chat thread.</p>
                  <Input value={chatName} onChange={(e) => setChatName(e.target.value)} placeholder="Your name" required />
                  <Input value={chatEmail} onChange={(e) => setChatEmail(e.target.value)} placeholder="Your email" type="email" />
                  <Button type="submit" disabled={!website}>Start chat</Button>
                </form>
              ) : (
                <div className="overflow-hidden rounded-[1.75rem] bg-muted">
                  <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
                    <div>
                      <p className="font-semibold">{website?.name ?? "Support"}</p>
                      <p className="text-xs text-primary-foreground/70">Chat ID: {chatId}</p>
                    </div>
                    <div className="text-right text-xs text-primary-foreground/70">
                      <p>{chatName || "Visitor"}</p>
                      {chatEmail ? <p>{chatEmail}</p> : null}
                    </div>
                  </div>
                  <div className="h-[420px] overflow-y-auto bg-background px-4 py-4">
                    {messages.length === 0 ? (
                      <div className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground">
                        {website?.widget_greeting ?? "Hi! How can we help you?"}
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[82%] rounded-[1.25rem] px-4 py-3 text-sm ${
                              message.sender === "visitor" ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`mt-1 text-[10px] ${message.sender === "visitor" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  <form onSubmit={sendMessage} className="flex gap-2 bg-card p-3">
                    <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message" className="flex-1" />
                    <Button type="submit" size="icon" disabled={sendingMessage || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[2rem] bg-card p-6">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">News & updates</h2>
                  <p className="text-sm text-muted-foreground">Published product updates and announcements.</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {updates.map((update) => (
                  <article key={update.id} className="rounded-[1.5rem] bg-muted p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-primary">{update.label ?? "Update"}</p>
                        <h3 className="mt-2 text-lg font-bold">{update.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(update.published_at)}</p>
                    </div>
                    {update.summary ? <p className="mt-3 text-sm text-muted-foreground">{update.summary}</p> : null}
                    {update.content ? <p className="mt-4 text-sm leading-6 text-foreground/90">{update.content}</p> : null}
                  </article>
                ))}
                {updates.length === 0 ? <p className="text-sm text-muted-foreground">No updates published yet.</p> : null}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between rounded-[1.5rem] bg-card px-5 py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> afuchatgroup@gmail.com
            </div>
            <Button asChild variant="ghost">
              <Link to="/auth">Open dashboard</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
