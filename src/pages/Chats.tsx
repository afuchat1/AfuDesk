import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Chat = Tables<"chats"> & { website_name?: string };
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

  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user]);

  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel(`messages-${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chats-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, () => {
        fetchChats();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    if (!user) return;
    const { data: websites } = await supabase
      .from("websites")
      .select("id, name")
      .eq("owner_id", user.id);

    if (!websites || websites.length === 0) {
      setChats([]);
      setLoading(false);
      return;
    }

    const websiteMap = Object.fromEntries(websites.map((w) => [w.id, w.name]));
    const websiteIds = websites.map((w) => w.id);

    const { data: chatsData } = await supabase
      .from("chats")
      .select("*")
      .in("website_id", websiteIds)
      .order("updated_at", { ascending: false });

    setChats(
      (chatsData ?? []).map((c) => ({
        ...c,
        website_name: websiteMap[c.website_id] ?? "Unknown",
      }))
    );
    setLoading(false);
  };

  const selectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      chat_id: selectedChat.id,
      sender: "agent",
      content: newMessage.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setNewMessage("");
    setSending(false);
  };

  const toggleStatus = async (chat: Chat) => {
    const newStatus = chat.status === "open" ? "closed" : "open";
    await supabase
      .from("chats")
      .update({
        status: newStatus,
        closed_at: newStatus === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", chat.id);
    setSelectedChat((prev) => (prev ? { ...prev, status: newStatus } : null));
    fetchChats();
  };

  const filteredChats = chats.filter((c) => {
    const matchesSearch =
      !search ||
      c.visitor_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.visitor_email?.toLowerCase().includes(search.toLowerCase());
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

  // Chat list panel
  const chatListPanel = (
    <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden">
      <div className="p-3 space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "open", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No conversations found
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                selectedChat?.id === chat.id ? "bg-muted/60" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0 mt-0.5">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                    {(chat.visitor_name?.[0] || "A").toUpperCase()}
                  </div>
                  {chat.status === "open" && (
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-success text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">
                      {chat.visitor_name || "Anonymous"}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {getTimeSince(chat.updated_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.website_name}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // Chat messages panel
  const chatMessagesPanel = (
    <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden">
      {selectedChat ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 p-3 border-b border-border/50 shrink-0">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSelectedChat(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                {(selectedChat.visitor_name?.[0] || "A").toUpperCase()}
              </div>
              {selectedChat.status === "open" && (
                <Circle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 fill-success text-success" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {selectedChat.visitor_name || "Anonymous"}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {selectedChat.visitor_email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 shrink-0" /> {selectedChat.visitor_email}
                  </span>
                )}
                {selectedChat.visitor_location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" /> {selectedChat.visitor_location}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStatus(selectedChat)}
              className="text-xs shrink-0 h-7 px-2"
            >
              {selectedChat.status === "open" ? "Close" : "Reopen"}
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-3 py-3 space-y-3">
            {messages.map((msg, i) => {
              const isAgent = msg.sender === "agent";
              const showDate = i === 0 || 
                new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString();
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {new Date(msg.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        isAgent
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isAgent ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 flex gap-2 shrink-0 border-t border-border/50">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedChat.status === "closed" ? "Chat is closed" : "Type a reply..."}
              className="flex-1 h-10"
              disabled={selectedChat.status === "closed"}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={!newMessage.trim() || sending || selectedChat.status === "closed"}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Select a chat</h3>
            <p className="text-sm text-muted-foreground">
              Choose a conversation to start replying
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="animate-fade-in h-[calc(100vh-7rem)] md:h-[calc(100vh-2.5rem)] flex flex-col">
        <div className="mb-3 shrink-0">
          <h1 className="text-xl font-bold text-foreground">Chats</h1>
          <p className="text-xs text-muted-foreground">Manage conversations with visitors</p>
        </div>

        {isMobile ? (
          // Mobile: show list or chat
          <div className="flex-1 overflow-hidden min-h-0">
            {selectedChat ? chatMessagesPanel : chatListPanel}
          </div>
        ) : (
          // Desktop: side by side
          <div className="flex-1 flex gap-3 overflow-hidden min-h-0">
            <div className="w-72 shrink-0">{chatListPanel}</div>
            <div className="flex-1">{chatMessagesPanel}</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
