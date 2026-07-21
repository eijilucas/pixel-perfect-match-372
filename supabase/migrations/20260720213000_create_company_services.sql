-- ============ COMPANY SERVICES ============
CREATE TABLE IF NOT EXISTS public.company_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_value NUMERIC(12,2),
  annual_value NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'ativo',
  started_at DATE,
  ended_at DATE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_services TO authenticated;
GRANT ALL ON public.company_services TO service_role;
ALTER TABLE public.company_services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'company_services'
      AND policyname = 'company_services all authenticated'
  ) THEN
    CREATE POLICY "company_services all authenticated"
      ON public.company_services
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_company_services_updated ON public.company_services;
CREATE TRIGGER trg_company_services_updated
BEFORE UPDATE ON public.company_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_company_services_company ON public.company_services(company_id);
CREATE INDEX IF NOT EXISTS idx_company_services_status ON public.company_services(status);

-- Preserve contracts that were previously modeled as won/client-active opportunities.
INSERT INTO public.company_services (
  company_id,
  name,
  monthly_value,
  annual_value,
  status,
  owner_id,
  created_by,
  created_at,
  updated_at
)
SELECT
  o.company_id,
  COALESCE(NULLIF(o.service_of_interest, ''), o.name),
  o.monthly_value,
  o.annual_value,
  'ativo',
  o.owner_id,
  o.created_by,
  o.created_at,
  o.updated_at
FROM public.opportunities o
WHERE o.stage = 'cliente_ativo'
  AND COALESCE(NULLIF(o.service_of_interest, ''), o.name) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.company_services cs
    WHERE cs.company_id = o.company_id
      AND lower(cs.name) = lower(COALESCE(NULLIF(o.service_of_interest, ''), o.name))
  );
