import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Globe,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Instant messaging with your website visitors. Never miss a conversation.",
  },
  {
    icon: Globe,
    title: "Multi-site Support",
    description: "Manage multiple websites from a single dashboard with isolated chats.",
  },
  {
    icon: Zap,
    title: "Easy Integration",
    description: "One line of code. Copy-paste the widget snippet and you're live.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Multi-tenant isolation ensures your data stays yours.",
  },
];

const benefits = [
  "Embeddable chat widget",
  "Real-time message delivery",
  "Email notifications",
  "Visitor details & history",
  "Chat search & filtering",
  "Customizable widget colors",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-orange">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AfuDesk</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-20 md:py-32 text-center">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            Live chat for modern websites
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Talk to your visitors{" "}
            <span className="gradient-text">in real time</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            AfuDesk is a multi-tenant live chat platform. Add a chat widget to your website in
            seconds and never miss a customer conversation.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container pb-20">
        <div className="glass-card rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Everything you need
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-2xl mx-auto">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            AfuDesk
          </div>
          <p>© {new Date().getFullYear()} AfuDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
