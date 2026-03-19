import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, MessageSquare, MessageCircle, Clock, TrendingUp } from "lucide-react";

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
    { icon: Globe, label: "Websites", value: stats.totalWebsites, accent: "bg-primary/10 text-primary" },
    { icon: MessageSquare, label: "Total Chats", value: stats.totalChats, accent: "bg-primary/10 text-primary" },
    { icon: Clock, label: "Open Chats", value: stats.openChats, accent: "bg-success/10 text-success" },
    { icon: MessageCircle, label: "Messages", value: stats.totalMessages, accent: "bg-warning/10 text-warning" },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <p className="text-muted-foreground text-xs mb-5">Overview of your AfuDesk activity</p>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-4">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent} mb-3`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : stat.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
