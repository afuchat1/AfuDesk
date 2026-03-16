import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  Globe,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Globe, label: "Websites", path: "/dashboard/websites" },
  { icon: MessageSquare, label: "Chats", path: "/dashboard/chats" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-accent-foreground">AfuDesk</span>
          <button
            className="ml-auto md:hidden text-sidebar-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border px-6 md:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">AfuDesk</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
