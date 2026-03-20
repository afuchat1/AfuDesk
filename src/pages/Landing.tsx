import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Globe,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Mail,
  BarChart3,
  Palette,
  Users,
} from "lucide-react";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: MessageSquare,
    title: "Live Conversations",
    description: "Respond to visitors the moment they reach out. Real-time, zero delay.",
    stat: "< 1s",
    statLabel: "delivery",
  },
  {
    icon: Globe,
    title: "Multi-site Control",
    description: "Run support for every domain from one unified inbox.",
    stat: "∞",
    statLabel: "websites",
  },
  {
    icon: Zap,
    title: "One-line Install",
    description: "Drop a single script tag. The widget handles the rest.",
    stat: "1",
    statLabel: "line of code",
  },
  {
    icon: Shield,
    title: "Tenant Isolation",
    description: "Each site's data is walled off. Your visitors' privacy is non-negotiable.",
    stat: "100%",
    statLabel: "isolated",
  },
];

const capabilities = [
  { icon: Palette, text: "Customizable widget branding" },
  { icon: BarChart3, text: "Chat analytics & history" },
  { icon: Mail, text: "Email notifications on new chats" },
  { icon: Users, text: "Visitor details & location" },
  { icon: CheckCircle2, text: "Help articles & knowledge base" },
  { icon: Zap, text: "Support tickets & updates" },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0) blur(0)";
          el.style.filter = "blur(0px)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        filter: "blur(4px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-transform duration-200 group-hover:scale-95 group-active:scale-90">
              <MessageSquare className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">AfuDesk</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link to="/demo">Demo</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">
                Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container pt-16 pb-24 md:pt-28 md:pb-36">
        <RevealSection className="max-w-2xl">
          <p className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
            Live chat infrastructure
          </p>
          <h1 className="text-[2.5rem] md:text-[3.5rem] font-extrabold leading-[1.05] tracking-tight text-foreground text-wrap-balance">
            Support that meets visitors where they are
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
            AfuDesk embeds real-time chat into any website. One script tag, full dashboard control,
            instant email alerts — no complexity, no bloat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="h-12 px-6 text-sm font-semibold active:scale-[0.97] transition-transform">
              <Link to="/auth">
                Start for free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="h-12 px-6 text-sm font-semibold active:scale-[0.97] transition-transform">
              <Link to="/demo">See it in action</Link>
            </Button>
          </div>
        </RevealSection>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <RevealSection key={f.title} delay={i * 80}>
              <div className="group bg-secondary/40 rounded-2xl p-6 transition-colors duration-300 hover:bg-secondary/70 cursor-default">
                <f.icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-5">{f.description}</p>
                <div className="pt-4" style={{ borderTop: "1px solid hsl(225 10% 18%)" }}>
                  <span className="text-xl font-bold text-foreground">{f.stat}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wider">{f.statLabel}</span>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="container pb-24">
        <RevealSection>
          <div className="bg-secondary/30 rounded-2xl p-8 md:p-12">
            <div className="max-w-lg mb-8">
              <p className="text-xs font-medium tracking-widest uppercase text-primary mb-3">Capabilities</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Built for teams who care about support
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capabilities.map((c, i) => (
                <RevealSection key={c.text} delay={i * 60}>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <c.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{c.text}</span>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </RevealSection>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <RevealSection className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">Ready to talk to your visitors?</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Set up AfuDesk in under two minutes. No credit card needed.
          </p>
          <Button size="lg" asChild className="h-12 px-8 active:scale-[0.97] transition-transform">
            <Link to="/auth">
              Create your account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </RevealSection>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-secondary/30 py-10">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-bold text-foreground text-sm">AfuDesk</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-tenant live chat SaaS for modern websites. Engage visitors in real time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/auth" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link to="/demo" className="hover:text-primary transition-colors">Live Demo</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Contact</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <a href="mailto:afuchatgroup@gmail.com" className="hover:text-primary transition-colors">afuchatgroup@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-5 text-center text-[10px] text-muted-foreground" style={{ borderTop: "1px solid hsl(225 10% 18%)" }}>
            © {new Date().getFullYear()} AfuDesk. All rights reserved. Managed by afuchatgroup@gmail.com
          </div>
        </div>
      </footer>
    </div>
  );
}
