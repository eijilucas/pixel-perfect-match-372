
-- ============ ENUMS ============
CREATE TYPE public.company_status AS ENUM ('lead','qualificado','oportunidade_futura','cliente_ativo','cliente_inativo','desqualificado');
CREATE TYPE public.company_origin AS ENUM ('indicacao','site','prospeccao_ativa','parceiro','evento','campanha','outro');
CREATE TYPE public.priority_level AS ENUM ('baixa','media','alta');
CREATE TYPE public.tri_state AS ENUM ('sim','nao','parcial','nao_sei');
CREATE TYPE public.bi_state AS ENUM ('sim','nao','nao_sei');
CREATE TYPE public.urgency_level AS ENUM ('baixo','medio','alto');
CREATE TYPE public.lead_status AS ENUM ('novo','em_contato','qualificado','desqualificado','oportunidade_futura');
CREATE TYPE public.contact_role AS ENUM ('decisor','influenciador','tecnico','financeiro','operacional');
CREATE TYPE public.pipeline_stage AS ENUM (
  'novo_lead','em_qualificacao','oportunidade_futura','reuniao_agendada','diagnostico_ti',
  'proposta_a_desenvolver','proposta_em_desenvolvimento','proposta_apresentada','negociacao',
  'contrato_aceito','onboarding','cliente_ativo','desqualificado','perdido'
);
CREATE TYPE public.activity_type AS ENUM (
  'whatsapp','ligacao','email','reuniao','visita','diagnostico',
  'desenvolver_proposta','apresentar_proposta','follow_up',
  'notificar_equipe','solicitar_onboarding','renovacao'
);
CREATE TYPE public.activity_status AS ENUM ('pendente','concluida','atrasada','cancelada');
CREATE TYPE public.interaction_type AS ENUM (
  'nota','whatsapp','ligacao','reuniao','diagnostico','mudanca_etapa',
  'proposta_criada','proposta_apresentada','proposta_aceita','cliente_ativado'
);

-- ============ UPDATED_AT TRIGGER FN ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  segment TEXT,
  city TEXT,
  state TEXT,
  website TEXT,
  employees_count INT,
  it_users_count INT,
  status public.company_status NOT NULL DEFAULT 'lead',
  lead_status public.lead_status,
  origin public.company_origin,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority public.priority_level DEFAULT 'media',
  notes TEXT,
  -- Hinfros diagnóstico
  can_stop public.bi_state,
  has_backup public.tri_state,
  uses_cloud public.tri_state,
  has_support public.bi_state,
  has_it_contract public.bi_state,
  main_risk TEXT,
  main_goal TEXT,
  urgency public.urgency_level,
  -- Lead qualification
  has_buying_potential BOOLEAN,
  answered_contact BOOLEAN,
  interested_now BOOLEAN,
  main_pain TEXT,
  service_of_interest TEXT,
  best_return_date DATE,
  disqualification_reason TEXT,
  future_opportunity_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies all authenticated" ON public.companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_lead_status ON public.companies(lead_status);

-- ============ CONTACTS ============
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_title TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  decision_role public.contact_role,
  contact_preference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts all authenticated" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_contacts_company ON public.contacts(company_id);

-- ============ OPPORTUNITIES ============
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  primary_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  service_of_interest TEXT,
  monthly_value NUMERIC(12,2),
  annual_value NUMERIC(12,2),
  setup_value NUMERIC(12,2),
  expected_close_date DATE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  stage public.pipeline_stage NOT NULL DEFAULT 'novo_lead',
  probability INT CHECK (probability BETWEEN 0 AND 100),
  main_pain TEXT,
  diagnosis_summary TEXT,
  recommended_solution TEXT,
  next_step TEXT,
  loss_reason TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities all authenticated" ON public.opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_opportunities_updated BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_company ON public.opportunities(company_id);

-- ============ ACTIVITIES ============
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type public.activity_type NOT NULL,
  status public.activity_status NOT NULL DEFAULT 'pendente',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities all authenticated" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_activities_updated BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_activities_owner ON public.activities(owner_id);
CREATE INDEX idx_activities_due ON public.activities(due_date);
CREATE INDEX idx_activities_status ON public.activities(status);

-- ============ INTERACTIONS (histórico manual) ============
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.interaction_type NOT NULL,
  summary TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO service_role;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interactions all authenticated" ON public.interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_interactions_company ON public.interactions(company_id);
CREATE INDEX idx_interactions_opportunity ON public.interactions(opportunity_id);

-- ============ PIPELINE STAGE CHANGES ============
CREATE TABLE public.pipeline_stage_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  from_stage public.pipeline_stage,
  to_stage public.pipeline_stage NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_stage_changes TO authenticated;
GRANT ALL ON public.pipeline_stage_changes TO service_role;
ALTER TABLE public.pipeline_stage_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stage_changes all authenticated" ON public.pipeline_stage_changes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_stage_changes_opp ON public.pipeline_stage_changes(opportunity_id);
