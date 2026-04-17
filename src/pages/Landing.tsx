import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Globe,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Mail,
  BarChart3,
  Users,
  Inbox,
  Clock3,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: Inbox,
    title: "Shared team inbox",
    description: "See every visitor conversation, website, status, and reply in one clean workspace.",
  },
  {
    icon: Code2,
    title: "Install with one script",
    description: "Add the widget to any site without rebuilding your stack or adding a new backend.",
  },
  {
    icon: Mail,
    title: "Message notifications",
    description: "New visitor messages can notify the site owner through Supabase Edge Functions.",
  },
  {
    icon: ShieldCheck,
    title: "Supabase-backed data",
    description: "Authentication, chat data, realtime events, and policies stay in your Supabase project.",
  },
];

const metrics = [
  { label: "Active sites", value: "12" },
  { label: "Open chats", value: "28" },
  { label: "Avg. reply", value: "2m" },
];

const capabilities = [
  "Live visitor chat",
  "Multi-website dashboard",
  "Realtime message updates",
  "Support tickets",
  "Help articles",
  "Widget branding",
];

const conversations = [
  { name: "Maya Chen", message: "Can I add this to two stores?", time: "2m", active: true },
  { name: "Jordan Lee", message: "I need help with installation.", time: "12m", active: false },
  { name: "Nora Patel", message: "Thanks, that fixed it.", time: "1h", active: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" data-testid="link-home">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight" data-testid="text-brand-name">AfuDesk</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/demo" data-testid="link-demo">Demo</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth" data-testid="link-sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth" data-testid="link-get-started">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <section className="container grid gap-12 py-16 md:grid-cols-[1fr_0.92fr] md:items-center md:py-24">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-sm text-muted-foreground" data-testid="text-platform-badge">
              <span className="h-2 w-2 rounded-full bg-success" />
              Live chat platform for growing websites
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-wrap-balance md:text-6xl" data-testid="text-hero-title">
              A professional support inbox for every website you run.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground" data-testid="text-hero-description">
              AfuDesk gives you a real-time chat widget, team dashboard, help content, tickets, and email alerts without moving your backend out of Supabase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" data-testid="link-start-free">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/demo" data-testid="link-see-demo">View live demo</Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-md border bg-card p-4" data-testid={`card-metric-${metric.label.toLowerCase().replaceAll(" ", "-")}`}>
                  <div className="text-2xl font-semibold" data-testid={`text-metric-value-${metric.label.toLowerCase().replaceAll(" ", "-")}`}>{metric.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-metric-label-${metric.label.toLowerCase().replaceAll(" ", "-")}`}>{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-card p-3" data-testid="panel-product-preview">
            <div className="rounded-md border bg-background">
              <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold" data-testid="text-preview-title">Conversations</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-preview-subtitle">28 open · 3 websites</p>
                </div>
                <div className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground" data-testid="status-online">Online</div>
              </div>
              <div className="grid min-h-[420px] md:grid-cols-[0.9fr_1.2fr]">
                <div className="border-b md:border-b-0 md:border-r">
                  {conversations.map((conversation) => (
                    <div key={conversation.name} className={`border-b p-4 ${conversation.active ? "bg-secondary/70" : "bg-card"}`} data-testid={`row-conversation-${conversation.name.toLowerCase().replaceAll(" ", "-")}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                            {conversation.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" data-testid={`text-conversation-name-${conversation.name.toLowerCase().replaceAll(" ", "-")}`}>{conversation.name}</p>
                            <p className="truncate text-xs text-muted-foreground" data-testid={`text-conversation-message-${conversation.name.toLowerCase().replaceAll(" ", "-")}`}>{conversation.message}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground" data-testid={`text-conversation-time-${conversation.name.toLowerCase().replaceAll(" ", "-")}`}>{conversation.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="border-b p-4">
                    <p className="text-sm font-semibold" data-testid="text-active-visitor">Maya Chen</p>
                    <p className="text-xs text-muted-foreground" data-testid="text-active-website">Checkout page · afuchat.com</p>
                  </div>
                  <div className="flex-1 space-y-3 p-4">
                    <div className="max-w-[82%] rounded-md bg-secondary p-3 text-sm" data-testid="text-visitor-message">Can I add the widget to two different stores?</div>
                    <div className="ml-auto max-w-[82%] rounded-md bg-primary p-3 text-sm text-primary-foreground" data-testid="text-agent-message">Yes. Add each store as a website, then paste its script tag before the closing body tag.</div>
                    <div className="max-w-[82%] rounded-md bg-secondary p-3 text-sm" data-testid="text-visitor-followup">Perfect. Does it still use Supabase realtime?</div>
                  </div>
                  <div className="border-t p-4">
                    <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground" data-testid="input-preview-reply">
                      Type a reply...
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-card">
          <div className="container grid gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-md border bg-background p-5" data-testid={`card-feature-${feature.title.toLowerCase().replaceAll(" ", "-")}`}>
                <feature.icon className="mb-4 h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold" data-testid={`text-feature-title-${feature.title.toLowerCase().replaceAll(" ", "-")}`}>{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground" data-testid={`text-feature-description-${feature.title.toLowerCase().replaceAll(" ", "-")}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container grid gap-10 py-16 md:grid-cols-[0.85fr_1fr] md:items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground" data-testid="text-operations-label">Support operations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight" data-testid="text-capabilities-title">Everything a small support team needs to look established.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground" data-testid="text-capabilities-description">
              The product feels simple for visitors and structured for operators: chats, sites, tickets, help content, and notifications are organized around real support workflows.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border bg-card p-4" data-testid={`row-capability-${item.toLowerCase().replaceAll(" ", "-")}`}>
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium" data-testid={`text-capability-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="container pb-16">
          <div className="rounded-md border bg-card p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-cta-title">Launch support without adding backend work.</h2>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="text-cta-description">Create an account, add your website, and paste one script tag.</p>
            </div>
            <Button className="mt-6 md:mt-0" asChild>
              <Link to="/auth" data-testid="link-create-account">Create account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-8">
        <div className="container flex flex-col justify-between gap-4 text-sm text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-2" data-testid="text-footer-brand">
            <MessageSquare className="h-4 w-4" />
            <span>AfuDesk</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/demo" className="hover:text-foreground" data-testid="link-footer-demo">Demo</Link>
            <Link to="/auth" className="hover:text-foreground" data-testid="link-footer-dashboard">Dashboard</Link>
            <a href="mailto:afuchatgroup@gmail.com" className="hover:text-foreground" data-testid="link-footer-contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
