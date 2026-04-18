import { Link } from "react-router-dom";
import { ChevronDown, Code2, FileText, Globe2, HelpCircle, History, LockKeyhole, MessageSquare, PanelTop, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const productItems = [
  { title: "Live chat", description: "Realtime visitor conversations", href: "/features", icon: MessageSquare },
  { title: "Support center", description: "Help articles, tickets, and updates", href: "/features#support-center", icon: HelpCircle },
  { title: "Dashboard", description: "Manage sites, teams, and inboxes", href: "/features#dashboard", icon: PanelTop },
];

const resourceItems = [
  { title: "Documentation", description: "Install and configure AfuDesk", href: "/docs", icon: FileText },
  { title: "Changelog", description: "See what changed recently", href: "/changelog", icon: History },
  { title: "Security", description: "Supabase-first data model", href: "/security", icon: LockKeyhole },
];

const companyItems = [
  { title: "Customers", description: "How teams use AfuDesk", href: "/customers", icon: Users },
  { title: "Contact", description: "Talk with the product team", href: "/contact", icon: Globe2 },
];

function Dropdown({ label, items, testId }: { label: string; items: typeof productItems; testId: string }) {
  return (
    <div className="group relative hidden lg:block">
      <button className="flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" data-testid={`button-nav-${testId}`}>
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-11 z-50 w-[420px] translate-y-1 rounded-2xl bg-card p-3 opacity-0 shadow-2xl shadow-slate-950/12 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid gap-1">
          {items.map((item) => (
            <Link key={item.title} to={item.href} className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-secondary" data-testid={`link-dropdown-${item.title.toLowerCase().replaceAll(" ", "-")}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground" data-testid={`text-dropdown-title-${item.title.toLowerCase().replaceAll(" ", "-")}`}>{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground" data-testid={`text-dropdown-description-${item.title.toLowerCase().replaceAll(" ", "-")}`}>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3" data-testid="link-public-home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight" data-testid="text-public-brand">AfuDesk</span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            <Dropdown label="Product" items={productItems} testId="product" />
            <Link to="/pricing" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" data-testid="link-nav-pricing">Pricing</Link>
            <Dropdown label="Resources" items={resourceItems} testId="resources" />
            <Dropdown label="Company" items={companyItems} testId="company" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/demo" data-testid="link-nav-demo">Demo</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth" data-testid="link-nav-sign-in">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth" data-testid="link-nav-get-started">Get started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

const footerGroups = [
  { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "Live demo", href: "/demo" }, { label: "Dashboard", href: "/auth" }] },
  { title: "Resources", links: [{ label: "Documentation", href: "/docs" }, { label: "Security", href: "/security" }, { label: "Changelog", href: "/changelog" }] },
  { title: "Company", links: [{ label: "Customers", href: "/customers" }, { label: "Contact", href: "/contact" }, { label: "Email us", href: "mailto:afuchatgroup@gmail.com" }] },
];

export function PublicFooter() {
  return (
    <footer className="bg-card py-14">
      <div className="container grid gap-10 lg:grid-cols-[1.15fr_2fr]">
        <div>
          <Link to="/" className="flex items-center gap-3" data-testid="link-footer-home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold" data-testid="text-footer-brand-name">AfuDesk</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground" data-testid="text-footer-description">
            Professional live chat, help content, tickets, and product updates for teams that run support directly on Supabase.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full bg-background px-3 py-1" data-testid="text-footer-badge-supabase">Supabase-first</span>
            <span className="rounded-full bg-background px-3 py-1" data-testid="text-footer-badge-realtime">Realtime chat</span>
            <span className="rounded-full bg-background px-3 py-1" data-testid="text-footer-badge-widget">Embeddable widget</span>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold" data-testid={`text-footer-group-${group.title.toLowerCase()}`}>{group.title}</h3>
              <div className="mt-4 grid gap-3">
                {group.links.map((link) => link.href.startsWith("mailto:") ? (
                  <a key={link.label} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid={`link-footer-${link.label.toLowerCase().replaceAll(" ", "-")}`}>{link.label}</a>
                ) : (
                  <Link key={link.label} to={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground" data-testid={`link-footer-${link.label.toLowerCase().replaceAll(" ", "-")}`}>{link.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container mt-10 flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p data-testid="text-footer-copyright">© 2026 AfuDesk. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/security" className="hover:text-foreground" data-testid="link-footer-privacy">Privacy</Link>
          <Link to="/docs" className="hover:text-foreground" data-testid="link-footer-terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      {children}
      <PublicFooter />
    </div>
  );
}
