DROP POLICY IF EXISTS "Anyone can create support tickets" ON public.support_tickets;

CREATE POLICY "Anyone can create support tickets for valid websites"
ON public.support_tickets
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.websites
    WHERE websites.id = support_tickets.website_id
  )
);