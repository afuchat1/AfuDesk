import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Globe, Copy, Trash2, Check, Code, ExternalLink } from "lucide-react";
import type { Website } from "@/lib/types";

export default function Websites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSnippet, setShowSnippet] = useState<string | null>(null);

  const fetchWebsites = async () => {
    if (!user) return;
    const data = await api.getWebsites();
    setWebsites(data);
    setLoading(false);
  };

  useEffect(() => { fetchWebsites().catch(() => setLoading(false)); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      await api.createWebsite({ name: name.trim(), domain: domain.trim() });
      toast({ title: "Website added!" });
      setName(""); setDomain(""); setDialogOpen(false); fetchWebsites();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWebsite(id);
      setWebsites((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Website removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getSnippet = (siteId: string) =>
    `<script src="${window.location.origin}/widget.js?site_id=${siteId}" async></script>`;

  const copySnippet = (siteId: string) => {
    navigator.clipboard.writeText(getSnippet(siteId));
    setCopiedId(siteId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Websites</h1>
              <p className="text-[11px] text-muted-foreground">{websites.length} connected</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 active:scale-95 transition-transform">
                <Plus className="h-4 w-4 mr-1.5" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Website</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-xs">Name</Label>
                  <Input id="siteName" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Website" required className="bg-secondary/40 border-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDomain" className="text-xs">Domain</Label>
                  <Input id="siteDomain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" required className="bg-secondary/40 border-0" />
                </div>
                <Button type="submit" className="w-full active:scale-[0.97] transition-transform" disabled={creating}>
                  {creating ? "Adding..." : "Add Website"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="bg-secondary/30 rounded-xl p-5 h-[72px] animate-pulse" />)}
          </div>
        ) : websites.length === 0 ? (
          <div className="bg-secondary/20 rounded-2xl p-14 text-center">
            <div className="h-14 w-14 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No websites yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Add your first website to start receiving chats.</p>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="active:scale-95 transition-transform">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Website
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {websites.map((site) => (
              <div key={site.id}>
                <div className="bg-secondary/30 rounded-xl p-4 flex items-center gap-4 transition-colors hover:bg-secondary/50 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0 transition-transform group-hover:scale-95">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{site.name}</h3>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      <ExternalLink className="h-2.5 w-2.5" /> {site.domain}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setShowSnippet(showSnippet === site.id ? null : site.id)} className="h-8 w-8 p-0">
                      <Code className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copySnippet(site.id)} className="h-8 w-8 p-0">
                      {copiedId === site.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(site.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {showSnippet === site.id && (
                  <div className="bg-secondary/50 rounded-xl mt-1 p-4">
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Paste before the closing <code className="text-primary font-mono">&lt;/body&gt;</code> tag:
                    </p>
                    <code className="block text-[11px] text-foreground font-mono break-all select-all leading-relaxed bg-background/50 rounded-lg p-3">
                      {getSnippet(site.id)}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
