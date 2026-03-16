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
import { Plus, Globe, Copy, Trash2, Check, Code } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Website = Tables<"websites">;

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
      setWebsites((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Website removed" });
    }
  };

  const getSnippet = (siteId: string) => {
    return `<script src="${window.location.origin}/widget.js?site_id=${siteId}" async></script>`;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Websites</h1>
            <p className="text-sm text-muted-foreground">Manage your connected websites</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Website
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Website</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Website Name</Label>
                  <Input
                    id="siteName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Website"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDomain">Domain</Label>
                  <Input
                    id="siteDomain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="example.com"
                    required
                  />
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-lg p-5 h-20 animate-pulse" />
            ))}
          </div>
        ) : websites.length === 0 ? (
          <div className="bg-card rounded-lg p-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No websites yet</h3>
            <p className="text-sm text-muted-foreground">Add your first website to start receiving chats.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {websites.map((site) => (
              <div key={site.id}>
                <div className="bg-card rounded-lg p-4 flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{site.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{site.domain}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSnippet(showSnippet === site.id ? null : site.id)}
                    >
                      <Code className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySnippet(site.id)}
                    >
                      {copiedId === site.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(site.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {showSnippet === site.id && (
                  <div className="bg-muted rounded-lg mt-1 p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Paste this before the closing <code className="text-primary">&lt;/body&gt;</code> tag:
                    </p>
                    <code className="block text-xs text-foreground font-mono break-all select-all">
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
