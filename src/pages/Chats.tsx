import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MessageSquare,
  Send,
  Search,
  Mail,
  MapPin,
  ArrowLeft,
  Circle,
  Clock,
  CheckCheck,
  Smile,
  Paperclip,
  MoreVertical,
  User,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Chat = Tables<"chats"> & { website_name?: string; last_message?: string };
type Message = Tables<"messages">;

export default function Chats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) fetchChats(); }, [user]);

  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel(`messages-${selectedChat.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${selectedChat.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, () => fetchChats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    if (!user) return;
    const { data: websites } = await supabase.from("websites").select("id, name").eq("owner_id", user.id);
    if (!websites || websites.length === 0) { setChats([]); setLoading(false); return; }
    const websiteMap = Object.fromEntries(websites.map((w) => [w.id, w.name]));
    const websiteIds = websites.map((w) => w.id);
    const { data: chatsData } = await supabase.from("chats").select("*").in("website_id", websiteIds).order("updated_at", { ascending: false });
    
    // Fetch last message for each chat
    const enriched = await Promise.all(
      (chatsData ?? []).map(async (c) => {
        const { data: msgs } = await supabase.from("messages").select("content, sender").eq("chat_id", c.id).order("created_at", { ascending: false }).limit(1);
        return { ...c, website_name: websiteMap[c.website_id] ?? "Unknown", last_message: msgs?.[0]?.content ?? "" };
      })
    );
    setChats(enriched);
    setLoading(false);
  };

  const selectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    const { data } = await supabase.from("messages").select("*").eq("chat_id", chat.id).order("created_at", { ascending: true });
    setMessages(data ?? []);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ chat_id: selectedChat.id, sender: "agent", content: newMessage.trim() });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setNewMessage("");
    setSending(false);
  };

  const toggleStatus = async (chat: Chat) => {
    const newStatus = chat.status === "open" ? "closed" : "open";
    await supabase.from("chats").update({ status: newStatus, closed_at: newStatus === "closed" ? new Date().toISOString() : null }).eq("id", chat.id);
    setSelectedChat((prev) => (prev ? { ...prev, status: newStatus } : null));
    fetchChats();
  };

  const filteredChats = chats.filter((c) => {
    const matchesSearch = !search || c.visitor_name?.toLowerCase().includes(search.toLowerCase()) || c.visitor_email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const chatCount = { all: chats.length, open: chats.filter(c => c.status === "open").length, closed: chats.filter(c => c.status === "closed").length };

  // ── Chat List ──
  const chatListPanel = (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Search */}
      <div className="p-3 space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30" />
        </div>
        <div className="flex gap-1">
          {(["all", "open", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-95 ${
                filterStatus === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1 opacity-60">{chatCount[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[72px] rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-10 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No conversations</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = selectedChat?.id === chat.id;
            return (
              <button
                key={chat.id}
                onClick={() => selectChat(chat)}
                className={`w-full text-left px-3 py-3 transition-all duration-150 active:scale-[0.98] ${
                  isSelected ? "bg-primary/8" : "hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {(chat.visitor_name?.[0] || "A").toUpperCase()}
                    </div>
                    {chat.status === "open" && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-semibold text-sm truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {chat.visitor_name || "Anonymous"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2 tabular-nums">
                        {getTimeSince(chat.updated_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {chat.last_message || chat.website_name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Messages Panel ──
  const chatMessagesPanel = (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {selectedChat ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0 bg-secondary/20">
            {isMobile && (
              <button onClick={() => setSelectedChat(null)} className="text-muted-foreground hover:text-foreground transition-colors active:scale-95 mr-1">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="relative shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                {(selectedChat.visitor_name?.[0] || "A").toUpperCase()}
              </div>
              {selectedChat.status === "open" && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {selectedChat.visitor_name || "Anonymous"}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {selectedChat.visitor_email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-2.5 w-2.5 shrink-0" /> {selectedChat.visitor_email}
                  </span>
                )}
                {selectedChat.visitor_location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0" /> {selectedChat.visitor_location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(selectedChat.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant={selectedChat.status === "open" ? "secondary" : "default"}
                size="sm"
                onClick={() => toggleStatus(selectedChat)}
                className="text-xs h-7 px-3 active:scale-95 transition-transform"
              >
                {selectedChat.status === "open" ? "Close" : "Reopen"}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-4 py-4 space-y-1">
            {messages.map((msg, i) => {
              const isAgent = msg.sender === "agent";
              const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString();
              const showAvatar = i === 0 || messages[i - 1].sender !== msg.sender;
              const isLast = i === messages.length - 1 || messages[i + 1]?.sender !== msg.sender;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <span className="text-[10px] text-muted-foreground bg-secondary/60 px-4 py-1 rounded-full">
                        {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  )}
                  <div className={`flex items-end gap-2 ${isAgent ? "justify-end" : "justify-start"} ${showAvatar ? "mt-3" : "mt-0.5"}`}>
                    {!isAgent && (
                      <div className={`w-7 shrink-0 ${isLast ? "" : "invisible"}`}>
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed ${
                        isAgent
                          ? `bg-primary text-primary-foreground ${isLast ? "rounded-2xl rounded-br-md" : "rounded-2xl"}`
                          : `bg-secondary/60 text-foreground ${isLast ? "rounded-2xl rounded-bl-md" : "rounded-2xl"}`
                      }`}
                    >
                      <p className="overflow-wrap-break-word">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isAgent ? "justify-end" : ""}`}>
                        <span className={`text-[9px] ${isAgent ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isAgent && <CheckCheck className={`h-3 w-3 text-primary-foreground/40`} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedChat.status === "closed" ? (
            <div className="px-4 py-3 text-center shrink-0 bg-secondary/20">
              <p className="text-xs text-muted-foreground">This conversation is closed.</p>
              <button onClick={() => toggleStatus(selectedChat)} className="text-xs text-primary hover:underline mt-1">Reopen it</button>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="px-3 py-3 flex items-end gap-2 shrink-0 bg-secondary/10">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="h-11 pr-10 bg-secondary/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl text-sm"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl active:scale-95 transition-transform"
                disabled={!newMessage.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="h-16 w-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Select a conversation</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
              Choose from the list to start viewing and replying to messages
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="animate-fade-in h-[calc(100vh-7rem)] md:h-[calc(100vh-2.5rem)] flex flex-col">
        {!isMobile && (
          <div className="mb-3 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Conversations</h1>
              <p className="text-[11px] text-muted-foreground">{chatCount.open} open · {chatCount.all} total</p>
            </div>
          </div>
        )}

        {isMobile ? (
          <div className="flex-1 overflow-hidden min-h-0">
            {selectedChat ? chatMessagesPanel : chatListPanel}
          </div>
        ) : (
          <div className="flex-1 flex gap-0 overflow-hidden min-h-0 rounded-xl bg-card">
            <div className="w-80 shrink-0" style={{ borderRight: "1px solid hsl(225 10% 14%)" }}>{chatListPanel}</div>
            <div className="flex-1">{chatMessagesPanel}</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
