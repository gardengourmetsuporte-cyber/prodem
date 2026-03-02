
-- Table for quote/budget requests from the landing page
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public landing page form)
CREATE POLICY "Anyone can submit a quote request"
ON public.quote_requests
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can read (admin panel)
CREATE POLICY "Authenticated users can read quote requests"
ON public.quote_requests
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update status
CREATE POLICY "Authenticated users can update quote requests"
ON public.quote_requests
FOR UPDATE
USING (auth.uid() IS NOT NULL);
