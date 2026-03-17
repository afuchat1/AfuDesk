import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import type { Tables } from "@/integrations/supabase/types";

type Website = Tables<"websites">;

const WIDGET_BASE_URL = "https://6c32458b-80e0-4bbd-b548-049e7cbd9810.lovableproject.com";

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
    const { data } = await supabase
      .from("websites")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    setWebsites(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWebsites();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from("websites").insert({
      owner_id: user.id,
      name: name.trim(),
      domain: domain.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Website added!" });
      setName("");
      setDomain("");
      setDialogOpen(false);
      fetchWebsites();
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("websites").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setWebsites((prev) => prev.filter((website) => website.id !== id));
      toast({ title: "Website removed" });
    }
  };

  const getSnippet = (siteId: string) => {
    return `<script src="${WIDGET_BASE_URL}/widget.js?site_id=${siteId}" async></script>`;
  };

  const copySnippet = (siteId: string) => {
    navigator.clipboard.writeText(getSnippet(siteId));
    setCopiedId(siteId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Snippet copied to clipboard!" });
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Websites</h1>
            <p className="text-sm text-muted-foreground">Manage connected websites and grab the widget embed code.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Website
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Website</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Website Name</Label>
                  <Input id="siteName" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Website" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDomain">Domain</Label>
                  <Input id="siteDomain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" required />
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? "Creating..." : "Add Website"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-[1.5rem] bg-card" />
            ))}
          </div>
        ) : websites.length === 0 ? (
          <div className="rounded-[2rem] bg-card p-12 text-center">
            <Globe className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">No websites yet</h3>
            <p className="text-sm text-muted-foreground">Add your first website to start receiving chats and tickets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {websites.map((site) => (
              <div key={site.id} className="rounded-[1.75rem] bg-card p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted shrink-0">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{site.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">{site.domain}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowSnippet(showSnippet === site.id ? null : site.id)}>
                      <Code className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => copySnippet(site.id)}>
                      {copiedId === site.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/demo?site_id=${site.id}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(site.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showSnippet === site.id ? (
                  <div className="mt-4 rounded-[1.25rem] bg-muted p-4">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Paste this before the closing <code className="text-primary">&lt;/body&gt;</code> tag:
                    </p>
                    <code className="block break-all font-mono text-xs text-foreground select-all">{getSnippet(site.id)}</code>
                    <p className="mt-3 text-xs text-muted-foreground">
                      The demo support center is also available at <span className="text-foreground">/demo?site_id={site.id}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
