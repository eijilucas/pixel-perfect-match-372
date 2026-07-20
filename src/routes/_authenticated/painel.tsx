import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_STAGE_LABELS } from "@/lib/crm-labels";
import { brl, formatDate } from "@/lib/format";
import { Sparkles, CheckCircle2, XCircle, Clock, Calendar, FileText, DollarSign, ListTodo, AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/painel")({
  component: PainelPage,
});

function PainelPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [companies, activities, opps] = await Promise.all([
        supabase.from("companies").select("id, status, lead_status, created_at"),
        supabase.from("activities").select("id, status, due_date, title, type, company_id"),
        supabase.from("opportunities").select("id, stage, monthly_value, annual_value, name, company_id, updated_at"),
      ]);
      return {
        companies: companies.data ?? [],
        activities: activities.data ?? [],
        opportunities: opps.data ?? [],
      };
    },
  });

  const c = stats?.companies ?? [];
  const a = stats?.activities ?? [];
  const o = stats?.opportunities ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startPeriod = new Date();
  startPeriod.setDate(startPeriod.getDate() - 30);

  const newLeads = c.filter(x => x.status === "lead" && new Date(x.created_at) >= startPeriod).length;
  const qualified = c.filter(x => x.lead_status === "qualificado" || x.status === "qualificado").length;
  const disqualified = c.filter(x => x.status === "desqualificado").length;
  const futureOpps = c.filter(x => x.status === "oportunidade_futura").length;
  const meetings = o.filter(x => x.stage === "reuniao_agendada").length;
  const propDev = o.filter(x => x.stage === "proposta_em_desenvolvimento").length;
  const propPres = o.filter(x => x.stage === "proposta_apresentada").length;
  const propAcc = o.filter(x => x.stage === "contrato_aceito" || x.stage === "cliente_ativo").length;
  const openARR = o
    .filter(x => !["cliente_ativo", "perdido", "desqualificado"].includes(x.stage))
    .reduce((sum, x) => sum + Number(x.annual_value || 0), 0);
  const closedARR = o
    .filter(x => x.stage === "cliente_ativo")
    .reduce((sum, x) => sum + Number(x.annual_value || 0), 0);
  const activeClients = c.filter(x => x.status === "cliente_ativo").length;

  const todayTasks = a.filter(x => x.status === "pendente" && x.due_date && new Date(x.due_date).toDateString() === today.toDateString());
  const lateTasks = a.filter(x => x.status === "pendente" && x.due_date && new Date(x.due_date) < today);

  const activeOpps = o
    .filter(x => ["reuniao_agendada", "diagnostico_ti", "proposta_a_desenvolver", "proposta_em_desenvolvimento", "proposta_apresentada", "negociacao"].includes(x.stage))
    .slice(0, 8);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão do dia e do funil comercial</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Sparkles} label="Leads novos (30d)" value={newLeads} />
        <Stat icon={CheckCircle2} label="Qualificados" value={qualified} />
        <Stat icon={XCircle} label="Desqualificados" value={disqualified} />
        <Stat icon={Clock} label="Oport. futuras" value={futureOpps} />
        <Stat icon={Calendar} label="Reuniões agendadas" value={meetings} />
        <Stat icon={FileText} label="Propostas em dev." value={propDev} />
        <Stat icon={FileText} label="Propostas apresentadas" value={propPres} />
        <Stat icon={CheckCircle2} label="Propostas aceitas" value={propAcc} />
        <Stat icon={DollarSign} label="ARR em aberto" value={brl(openARR)} />
        <Stat icon={DollarSign} label="ARR fechado" value={brl(closedARR)} />
        <Stat icon={Building2Icon} label="Clientes ativos" value={activeClients} />
        <Stat icon={ListTodo} label="Tarefas hoje" value={todayTasks.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Tarefas atrasadas ({lateTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lateTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada.</p>
            ) : (
              lateTasks.slice(0, 6).map(t => (
                <Link key={t.id} to="/atividades" className="block text-sm border-l-2 border-destructive pl-3 py-1 hover:bg-muted/50 rounded-r">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">Vencia em {formatDate(t.due_date)}</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Oportunidades em andamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma oportunidade em andamento.</p>
            ) : (
              activeOpps.map(x => (
                <Link key={x.id} to="/funil" className="block text-sm border-l-2 border-accent pl-3 py-1 hover:bg-muted/50 rounded-r">
                  <div className="font-medium truncate">{x.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {PIPELINE_STAGE_LABELS[x.stage]} · {brl(Number(x.annual_value))}/ano
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="h-3.5 w-3.5" />
          <span className="truncate">{label}</span>
        </div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

// Local re-import to avoid conflict
import { Building2 as Building2Icon } from "lucide-react";
