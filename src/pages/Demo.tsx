import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, FileText, HelpCircle, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoMessage {
  id: number;
  sender: "visitor" | "agent";
  content: string;
  time: string;
}

const autoReplies = [
  "Thanks for reaching out. I can help with setup, tickets, help articles, or widget branding.",
  "The widget installs with one script tag and keeps data in your Supabase project.",
  "Each website can have its own color, greeting, support content, and conversation history.",
  "Your team can reply from the dashboard as soon as a message arrives.",
];

const tabs = [
  { label: "Chat", icon: MessageSquare, active: true },
  { label: "Help", icon: HelpCircle, active: false },
  { label: "Tickets", icon: FileText, active: false },
  { label: "News", icon: Bell, active: false },
];

export default function Demo() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    { id: 0, sender: "agent", content: "Welcome to AfuDesk Support. Send a message to preview the visitor experience.", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [replyIndex, setReplyIndex] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const visitorMsg: DemoMessage = { id: Date.now(), sender: "visitor", content: input.trim(), time: now() };
    setMessages((prev) => [...prev, visitorMsg]);
    setInput("");

    const reply = autoReplies[replyIndex % autoReplies.length];
    setReplyIndex((i) => i + 1);
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "agent", content: reply, time: now() }]);
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" data-testid="link-demo-home">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold" data-testid="text-demo-brand">AfuDesk</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/auth" data-testid="link-demo-sign-up">Sign up free</Link>
          </Button>
        </div>
      </nav>

      <main className="container grid gap-10 py-12 md:grid-cols-[0.78fr_1fr] md:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground" data-testid="text-demo-label">
            <ShieldCheck className="h-4 w-4" />
            Visitor widget preview
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight" data-testid="text-demo-title">A complete support center in one embedded widget.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground" data-testid="text-demo-description">
            The widget now presents live chat, help articles, support tickets, and product updates in a clean professional layout visitors can trust.
          </p>
          <div className="mt-6 grid max-w-md gap-3">
            {[
              "Flat, neutral support-center design",
              "Clear online status and response expectation",
              "Segmented navigation for chat, help, tickets, and news",
              "Readable messages, forms, empty states, and powered-by footer",
            ].map((item) => (
              <div key={item} className="rounded-md border bg-card px-4 py-3 text-sm font-medium" data-testid={`text-demo-benefit-${item.toLowerCase().replaceAll(" ", "-")}`}>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth" data-testid="link-demo-get-started">Get started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/" data-testid="link-demo-back-home">Back to home</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[430px] rounded-xl border bg-card p-3 shadow-sm" data-testid="panel-demo-widget">
          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="border-b bg-card px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" data-testid="text-demo-support-title">AfuDesk Support</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground" data-testid="status-demo-online">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Online · replies in minutes
                    </div>
                  </div>
                </div>
                <span className="rounded-md border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground" data-testid="text-demo-support-center">Support center</span>
              </div>
            </div>

            <div className="border-b bg-card px-3 py-2">
              <div className="grid grid-cols-4 gap-1 rounded-md bg-secondary p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    className={`flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold ${tab.active ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}
                    data-testid={`button-demo-tab-${tab.label.toLowerCase()}`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[390px] space-y-3 overflow-auto bg-background p-4">
              <div className="rounded-md border bg-card p-3 text-xs text-muted-foreground" data-testid="text-demo-context-card">
                Ask us about installation, pricing, support tickets, or help center content.
              </div>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-lg border px-4 py-2.5 text-sm shadow-sm ${
                      msg.sender === "visitor"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-card-foreground"
                    }`}
                    data-testid={`text-demo-message-${msg.id}`}
                  >
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${msg.sender === "visitor" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 border-t bg-card p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                data-testid="input-demo-message"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                disabled={!input.trim()}
                data-testid="button-demo-send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <div className="border-t bg-card py-2 text-center text-xs text-muted-foreground" data-testid="text-demo-powered-by">
              Powered by AfuDesk
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
