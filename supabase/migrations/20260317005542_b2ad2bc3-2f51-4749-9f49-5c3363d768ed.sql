-- Create public help center articles per website
CREATE TABLE IF NOT EXISTS public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published help articles"
ON public.help_articles
FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Owners can insert help articles"
ON public.help_articles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = help_articles.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update help articles"
ON public.help_articles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = help_articles.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete help articles"
ON public.help_articles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = help_articles.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE TRIGGER update_help_articles_updated_at
BEFORE UPDATE ON public.help_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create support updates/news per website
CREATE TABLE IF NOT EXISTS public.support_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  label TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published support updates"
ON public.support_updates
FOR SELECT
TO public
USING (is_published = true);

CREATE POLICY "Owners can insert support updates"
ON public.support_updates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_updates.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update support updates"
ON public.support_updates
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_updates.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete support updates"
ON public.support_updates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_updates.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE TRIGGER update_support_updates_updated_at
BEFORE UPDATE ON public.support_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create public support tickets per website
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create support tickets"
ON public.support_tickets
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Owners can view support tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_tickets.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update support tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_tickets.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete support tickets"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_tickets.website_id
      AND websites.owner_id = auth.uid()
  )
);

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_help_articles_website_published ON public.help_articles (website_id, is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_support_updates_website_published ON public.support_updates (website_id, is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_website_status ON public.support_tickets (website_id, status, created_at DESC);