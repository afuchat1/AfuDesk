import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Code2, FileText, Globe2, HelpCircle, History, LockKeyhole, MessageSquare, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/PublicChrome";

const pages = {
  "/features": {
    eyebrow: "Product",
    title: "Everything you need to support visitors from one embedded product.",
    description: "AfuDesk combines chat, help content, tickets, product updates, and a multi-site dashboard without adding another backend to your stack.",
    cta: "Start building support",
    cards: [
      { title: "Realtime live chat", description: "Respond to visitors as they browse your site with a clean visitor widget and operator inbox.", icon: MessageSquare },
      { title: "Support center", description: "Publish help articles, collect support tickets, and share product updates inside the same widget.", icon: HelpCircle },
      { title: "Multi-website dashboard", description: "Manage every site, widget color, greeting, and script tag from one workspace.", icon: Globe2 },
      { title: "Email alerts", description: "Notify owners when new conversations arrive so small teams never miss important messages.", icon: Clock3 },
      { title: "Supabase realtime", description: "Keep authentication, data, policies, realtime events, and functions in your Supabase project.", icon: Zap },
      { title: "Install script", description: "Paste one script tag and launch a professional support experience on any website.", icon: Code2 },
    ],
  },
  "/pricing": {
    eyebrow: "Pricing",
    title: "Simple plans for growing support teams.",
    description: "Start with the essentials, then expand across more websites and support workflows as your product grows.",
    cta: "Create free account",
    cards: [
      { title: "Starter", description: "Launch one support widget with live chat, help content, and email notifications.", icon: Sparkles },
      { title: "Growth", description: "Run support across multiple websites with tickets, updates, and dashboard workflows.", icon: Users },
      { title: "Scale", description: "Use AfuDesk as the front door for customer conversations across your portfolio.", icon: ShieldCheck },
    ],
  },
  "/docs": {
    eyebrow: "Documentation",
    title: "Install AfuDesk and keep your backend in Supabase.",
    description: "The setup is designed for builders: create a site, copy the script tag, customize the widget, and start receiving conversations.",
    cta: "Open dashboard",
    cards: [
      { title: "Create a website", description: "Add each domain you support and configure the public-facing widget identity.", icon: Globe2 },
      { title: "Paste the script", description: "Drop the generated script before the closing body tag of your site.", icon: Code2 },
      { title: "Publish help content", description: "Add articles, updates, and ticket forms so visitors can self-serve before chatting.", icon: FileText },
      { title: "Reply from the inbox", description: "Handle conversations and support requests from the AfuDesk dashboard.", icon: MessageSquare },
    ],
  },
  "/security": {
    eyebrow: "Security",
    title: "A Supabase-first architecture with clear data ownership.",
    description: "AfuDesk uses Supabase Auth, database policies, realtime events, and edge functions so the product stays explicit and portable.",
    cta: "Review setup",
    cards: [
      { title: "Public anon access", description: "The widget uses the public anon key with database policies controlling what visitors can do.", icon: LockKeyhole },
      { title: "No Replit runtime secrets", description: "Runtime product data and credentials stay with Supabase instead of the frontend host.", icon: ShieldCheck },
      { title: "Scoped records", description: "Websites, chats, messages, tickets, articles, and updates are organized around site ownership.", icon: BookOpen },
    ],
  },
  "/customers": {
    eyebrow: "Customers",
    title: "Built for founders, agencies, and small teams that need support to feel established.",
    description: "Use AfuDesk when you manage multiple websites and want every visitor to see a polished support experience.",
    cta: "View demo",
    cards: [
      { title: "SaaS founders", description: "Add a trustworthy support center before hiring a full support team.", icon: Sparkles },
      { title: "Agencies", description: "Give client websites a professional chat widget and centralized support dashboard.", icon: Users },
      { title: "Operators", description: "Turn visitor messages, tickets, help content, and updates into one daily workflow.", icon: CheckCircle2 },
    ],
  },
  "/changelog": {
    eyebrow: "Changelog",
    title: "AfuDesk is becoming a complete support platform.",
    description: "Recent updates focus on a professional UI, Supabase-only architecture, and a more complete embedded visitor widget.",
    cta: "Try the demo",
    cards: [
      { title: "Professional widget", description: "Chat, Help, Tickets, and News now sit inside a cleaner support-center interface.", icon: MessageSquare },
      { title: "Flat product UI", description: "Landing, demo, dashboard shell, and widget moved to a quieter SaaS visual system.", icon: Sparkles },
      { title: "Supabase migration", description: "Authentication, data, realtime, and email functions now talk directly to Supabase.", icon: ShieldCheck },
    ],
  },
  "/contact": {
    eyebrow: "Contact",
    title: "Talk to the AfuDesk team.",
    description: "Have a question about setup, product direction, or using AfuDesk across multiple sites? Reach out and we will respond by email.",
    cta: "Email AfuDesk",
    cards: [
      { title: "Product questions", description: "Ask what AfuDesk can support today and what should be added next.", icon: HelpCircle },
      { title: "Setup help", description: "Get guidance on script installation, Supabase configuration, and widget settings.", icon: Code2 },
      { title: "Partnerships", description: "Discuss agency, portfolio, and multi-site support workflows.", icon: Users },
    ],
  },
};

export default function PublicPage() {
  const location = useLocation();
  const page = pages[location.pathname as keyof typeof pages] || pages["/features"];
  const isContact = location.pathname === "/contact";
  const ctaHref = location.pathname === "/customers" || location.pathname === "/changelog" ? "/demo" : location.pathname === "/contact" ? "mailto:afuchatgroup@gmail.com" : "/auth";

  return (
    <PublicShell>
      <main>
        <section className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-primary" data-testid="text-page-eyebrow">{page.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-wrap-balance md:text-6xl" data-testid="text-page-title">{page.title}</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground" data-testid="text-page-description">{page.description}</p>
            <div className="mt-8 flex justify-center">
              {isContact ? (
                <Button size="lg" asChild>
                  <a href={ctaHref} data-testid="link-page-cta">{page.cta} <ArrowRight className="h-4 w-4" /></a>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link to={ctaHref} data-testid="link-page-cta">{page.cta} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="container pb-20">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {page.cards.map((card) => (
              <div key={card.title} className="rounded-2xl bg-card p-6 shadow-sm shadow-slate-950/5" data-testid={`card-page-${card.title.toLowerCase().replaceAll(" ", "-")}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-semibold" data-testid={`text-page-card-title-${card.title.toLowerCase().replaceAll(" ", "-")}`}>{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground" data-testid={`text-page-card-description-${card.title.toLowerCase().replaceAll(" ", "-")}`}>{card.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
