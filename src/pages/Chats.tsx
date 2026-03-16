import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  X,
  Search,
  User,
  Mail,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Chat = Tables<"chats"> & { website_name?: string };
type Message = Tables<"messages">;

export default function Chats() {
  const { user } = useAuth();
  const { toast } = useToast();
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

  // Real-time subscription for new messages
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat?.id]);

  // Real-time subscription for new chats
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  return (
    <DashboardLayout>
      <div className="animate-fade-in h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chats</h1>
            <p className="text-sm text-muted-foreground">Manage conversations with visitors</p>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* Chat list */}
          <div
            className={`w-full md:w-80 shrink-0 flex flex-col glass-card rounded-xl overflow-hidden ${
              selectedChat ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "open", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
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
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No chats found
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => selectChat(chat)}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                      selectedChat?.id === chat.id ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate">
                        {chat.visitor_name || "Anonymous"}
                      </span>
                      <Badge
                        variant={chat.status === "open" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {chat.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {chat.website_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(chat.started_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat messages */}
          <div
            className={`flex-1 flex flex-col glass-card rounded-xl overflow-hidden ${
              selectedChat ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedChat ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <button
                    className="md:hidden text-muted-foreground"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {selectedChat.visitor_name || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {selectedChat.visitor_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {selectedChat.visitor_email}
                        </span>
                      )}
                      {selectedChat.visitor_location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {selectedChat.visitor_location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(selectedChat)}
                  >
                    {selectedChat.status === "open" ? "Close" : "Reopen"}
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                          msg.sender === "agent"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.sender === "agent" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a reply..."
                    className="flex-1"
                    disabled={selectedChat.status === "closed"}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sending || selectedChat.status === "closed"}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Select a chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a conversation from the list to start replying
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
