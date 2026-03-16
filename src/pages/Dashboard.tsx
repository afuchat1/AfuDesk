import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, MessageSquare, MessageCircle, Clock } from "lucide-react";

interface Stats {
  totalWebsites: number;
  totalChats: number;
  openChats: number;
  totalMessages: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalWebsites: 0,
    totalChats: 0,
    openChats: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data: websites } = await supabase
        .from("websites")
        .select("id")
        .eq("owner_id", user.id);

      const websiteIds = websites?.map((w) => w.id) ?? [];

      let totalChats = 0;
      let openChats = 0;
      let totalMessages = 0;

      if (websiteIds.length > 0) {
        const { count: chatCount } = await supabase
          .from("chats")
          .select("*", { count: "exact", head: true })
          .in("website_id", websiteIds);

        const { count: openCount } = await supabase
          .from("chats")
          .select("*", { count: "exact", head: true })
          .in("website_id", websiteIds)
          .eq("status", "open");

        const { data: chats } = await supabase
          .from("chats")
          .select("id")
          .in("website_id", websiteIds);

        if (chats && chats.length > 0) {
          const chatIds = chats.map((c) => c.id);
          const { count: msgCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("chat_id", chatIds);
          totalMessages = msgCount ?? 0;
        }

        totalChats = chatCount ?? 0;
        openChats = openCount ?? 0;
      }

      setStats({
        totalWebsites: websites?.length ?? 0,
        totalChats,
        openChats,
        totalMessages,
      });
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { icon: Globe, label: "Websites", value: stats.totalWebsites, color: "text-primary" },
    { icon: MessageSquare, label: "Total Chats", value: stats.totalChats, color: "text-primary" },
    { icon: Clock, label: "Open Chats", value: stats.openChats, color: "text-success" },
    { icon: MessageCircle, label: "Messages", value: stats.totalMessages, color: "text-warning" },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-6">Overview of your AfuDesk activity</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "—" : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
