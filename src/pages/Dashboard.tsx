import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Bell, FileText, Globe, MessageCircle, MessageSquare, TicketPlus } from "lucide-react";

interface Stats {
  totalWebsites: number;
  totalChats: number;
  openChats: number;
  totalMessages: number;
  totalTickets: number;
  totalArticles: number;
  totalUpdates: number;
}

interface RecentTicket {
  id: string;
  visitor_name: string;
  subject: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalWebsites: 0,
    totalChats: 0,
    openChats: 0,
    totalMessages: 0,
    totalTickets: 0,
    totalArticles: 0,
    totalUpdates: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data: websites } = await supabase
        .from("websites")
        .select("id")
        .eq("owner_id", user.id);

      const websiteIds = websites?.map((website) => website.id) ?? [];
      let totalChats = 0;
      let openChats = 0;
      let totalMessages = 0;
      let totalTickets = 0;
      let totalArticles = 0;
      let totalUpdates = 0;
      let ticketRows: RecentTicket[] = [];

      if (websiteIds.length > 0) {
        const [chatCountResult, openCountResult, chatsResult, ticketResult, articleResult, updateResult, recentTicketResult] = await Promise.all([
          supabase.from("chats").select("*", { count: "exact", head: true }).in("website_id", websiteIds),
          supabase.from("chats").select("*", { count: "exact", head: true }).in("website_id", websiteIds).eq("status", "open"),
          supabase.from("chats").select("id").in("website_id", websiteIds),
          (supabase as any).from("support_tickets").select("*", { count: "exact", head: true }).in("website_id", websiteIds),
          (supabase as any).from("help_articles").select("*", { count: "exact", head: true }).in("website_id", websiteIds),
          (supabase as any).from("support_updates").select("*", { count: "exact", head: true }).in("website_id", websiteIds),
          (supabase as any)
            .from("support_tickets")
            .select("id, visitor_name, subject, status, created_at")
            .in("website_id", websiteIds)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const chatIds = chatsResult.data?.map((chat) => chat.id) ?? [];
        if (chatIds.length > 0) {
          const { count: messageCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("chat_id", chatIds);
          totalMessages = messageCount ?? 0;
        }

        totalChats = chatCountResult.count ?? 0;
        openChats = openCountResult.count ?? 0;
        totalTickets = ticketResult.count ?? 0;
        totalArticles = articleResult.count ?? 0;
        totalUpdates = updateResult.count ?? 0;
        ticketRows = recentTicketResult.data ?? [];
      }

      setStats({
        totalWebsites: websites?.length ?? 0,
        totalChats,
        openChats,
        totalMessages,
        totalTickets,
        totalArticles,
        totalUpdates,
      });
      setRecentTickets(ticketRows);
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { icon: Globe, label: "Websites", value: stats.totalWebsites },
    { icon: MessageSquare, label: "Chats", value: stats.totalChats },
    { icon: MessageCircle, label: "Messages", value: stats.totalMessages },
    { icon: TicketPlus, label: "Tickets", value: stats.totalTickets },
    { icon: FileText, label: "Articles", value: stats.totalArticles },
    { icon: Bell, label: "Updates", value: stats.totalUpdates },
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your support center, tickets, and live conversations.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-[1.5rem] bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{loading ? "—" : stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Recent tickets</h2>
                <p className="text-sm text-muted-foreground">Latest requests submitted from the public support center.</p>
              </div>
              <div className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-primary">
                {stats.totalTickets} total
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentTickets.length === 0 ? (
                <div className="rounded-[1.5rem] bg-muted px-5 py-6 text-sm text-muted-foreground">
                  No tickets yet — submit one from the demo page to see it appear here.
                </div>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-[1.5rem] bg-muted px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">{ticket.subject}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{ticket.visitor_name || "Visitor"}</p>
                      </div>
                      <div className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary">
                        {ticket.status}
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-card p-6">
            <h2 className="text-xl font-bold text-foreground">Live activity snapshot</h2>
            <p className="mt-1 text-sm text-muted-foreground">Track what is happening across the support experience.</p>

            <div className="mt-5 space-y-3">
              {[
                { label: "Open chats", value: stats.openChats, helper: "Conversations currently open" },
                { label: "Published help articles", value: stats.totalArticles, helper: "Knowledge base content live to visitors" },
                { label: "Published updates", value: stats.totalUpdates, helper: "News cards visible in the public experience" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] bg-muted px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.helper}</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{loading ? "—" : item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
