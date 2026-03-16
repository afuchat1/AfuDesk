import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoMessage {
  id: number;
  sender: "visitor" | "agent";
  content: string;
  time: string;
}

const autoReplies = [
  "Hey there! Thanks for reaching out. How can I help you today?",
  "That's a great question! Let me look into that for you.",
  "Sure thing! Our team typically responds within minutes on AfuDesk.",
  "Is there anything else I can help you with?",
  "Thanks for trying AfuDesk! Sign up to add live chat to your own website.",
];

export default function Demo() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    { id: 0, sender: "agent", content: "Hi! 👋 Welcome to AfuDesk demo. Try sending a message!", time: now() },
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
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">AfuDesk</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/auth">Sign Up Free</Link>
          </Button>
        </div>
      </nav>

      {/* Demo area */}
      <div className="flex-1 container py-8 flex flex-col items-center">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Live Demo</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            This is how AfuDesk looks on your website. Try sending a message — the agent will reply automatically.
          </p>
        </div>

        {/* Simulated widget */}
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-card rounded-xl overflow-hidden" style={{ height: 520 }}>
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-primary-foreground font-semibold text-sm">Demo Support</p>
                <p className="text-primary-foreground/70 text-xs">We typically reply instantly</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-primary-foreground/70 text-xs">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[360px] overflow-auto p-4 space-y-2" style={{ background: "hsl(225 25% 8%)" }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                      msg.sender === "visitor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                    style={msg.sender === "visitor" ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === "visitor" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="flex gap-2 p-3" style={{ background: "hsl(225 22% 11%)" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted text-foreground text-sm rounded-lg px-3 py-2 outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </form>

            {/* Powered by */}
            <div className="text-center py-2" style={{ background: "hsl(225 25% 6%)" }}>
              <span className="text-[11px] text-muted-foreground">
                Powered by <span className="text-primary font-semibold">AfuDesk</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center animate-fade-in">
          <p className="text-muted-foreground text-sm mb-4">Ready to add live chat to your website?</p>
          <Button asChild>
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AfuDesk. Managed by afuchatgroup@gmail.com
      </footer>
    </div>
  );
}
