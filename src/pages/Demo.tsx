import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoMessage {
  id: number;
  sender: "visitor" | "agent";
  content: string;
  time: string;
}

const autoReplies = [
  "Thanks for reaching out. How can I help today?",
  "I can help with that. The widget is installed with one script tag.",
  "Yes, each website can have its own widget settings and chat history.",
  "Our team can reply from the dashboard as soon as a message comes in.",
  "You can create an account to connect your own website.",
];

export default function Demo() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    { id: 0, sender: "agent", content: "Welcome to the AfuDesk demo. Send a message to see how the widget works.", time: now() },
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

      <main className="container grid gap-10 py-12 md:grid-cols-[0.8fr_1fr] md:items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground" data-testid="text-demo-label">Live widget preview</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight" data-testid="text-demo-title">A real chat experience, without the noise.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground" data-testid="text-demo-description">
            This preview shows the visitor-side widget in a clean, production-ready layout. Messages are simple, readable, and focused on support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth" data-testid="link-demo-get-started">Get started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/" data-testid="link-demo-back-home">Back to home</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-md border bg-card p-3" data-testid="panel-demo-widget">
          <div className="overflow-hidden rounded-md border bg-background">
            <div className="flex items-center gap-3 border-b bg-card px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold" data-testid="text-demo-support-title">Demo Support</p>
                <p className="text-xs text-muted-foreground" data-testid="text-demo-support-status">Usually replies in a few minutes</p>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground" data-testid="status-demo-online">
                <span className="h-2 w-2 rounded-full bg-success" />
                Online
              </div>
            </div>

            <div className="h-[360px] space-y-3 overflow-auto bg-background p-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-md px-4 py-2.5 text-sm ${
                      msg.sender === "visitor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
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
                placeholder="Type a message..."
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
