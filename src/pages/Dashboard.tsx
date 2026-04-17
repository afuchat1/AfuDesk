import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe, MessageSquare, MessageCircle, Clock, Activity } from "lucide-react";

interface Stats {
  totalWebsites: number;
  totalChats: number;
  openChats: number;
  totalMessages: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalWebsites: 0, totalChats: 0, openChats: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const data = await api.getStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats().catch(() => setLoading(false));
  }, [user]);

  const cards = [
    { icon: Globe, label: "Websites", value: stats.totalWebsites, color: "text-primary", bg: "bg-primary/10" },
    { icon: MessageSquare, label: "Total Chats", value: stats.totalChats, color: "text-primary", bg: "bg-primary/10" },
    { icon: Clock, label: "Open Now", value: stats.openChats, color: "text-success", bg: "bg-success/10" },
    { icon: MessageCircle, label: "Messages", value: stats.totalMessages, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Your AfuDesk overview</p>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-secondary/30 rounded-xl p-5 transition-colors hover:bg-secondary/50 group cursor-default">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} mb-4 transition-transform group-hover:scale-95`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">
                {loading ? (
                  <span className="inline-block h-8 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  c.value.toLocaleString()
                )}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
