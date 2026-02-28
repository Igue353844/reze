
-- Table to store multiple B2 accounts
CREATE TABLE public.b2_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  key_id text NOT NULL,
  app_key text NOT NULL,
  bucket_name text NOT NULL,
  endpoint text NOT NULL,
  max_storage_bytes bigint NOT NULL DEFAULT 10737418240, -- 10 GB default
  used_storage_bytes bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b2_accounts ENABLE ROW LEVEL SECURITY;

-- Only admins can manage B2 accounts
CREATE POLICY "Admins can view b2 accounts"
  ON public.b2_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert b2 accounts"
  ON public.b2_accounts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update b2 accounts"
  ON public.b2_accounts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete b2 accounts"
  ON public.b2_accounts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_b2_accounts_updated_at
  BEFORE UPDATE ON public.b2_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
