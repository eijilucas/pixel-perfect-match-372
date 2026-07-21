import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGES } from "@/lib/crm-labels";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/funil")({
  component: FunilPage,
});

type Stage = (typeof PIPELINE_STAGES)[number];

type FunnelItem = {
  dragId: string;
  source: "opportunity" | "company";
  id: string;
  company_id: string;
  companyName: string;
  name: string;
  annual_value: number | null;
  probability: number | null;
  service_of_interest?: string | null;
  main_pain?: string | null;
  stage: Stage;
};

const LEAD_COMPANY_STATUSES = ["lead", "qualificado", "oportunidade_futura", "cliente_ativo", "desqualificado"];

function companyStage(company: { status: string; lead_status: string | null }): Stage {
  if (company.status === "cliente_ativo") return "cliente_ativo";
  if (company.status === "desqualificado" || company.lead_status === "desqualificado") return "desqualificado";
  if (company.status === "oportunidade_futura" || company.lead_status === "oportunidade_futura") return "oportunidade_futura";
  if (company.status === "qualificado" || company.lead_status === "qualificado" || company.lead_status === "em_contato") {
    return "em_qualificacao";
  }
  return "novo_lead";
}

function companyPatchForStage(stage: Stage) {
  if (stage === "novo_lead") return { status: "lead", lead_status: "novo" };
  if (stage === "em_qualificacao") return { status: "lead", lead_status: "em_contato" };
  if (stage === "oportunidade_futura") return { status: "oportunidade_futura", lead_status: "oportunidade_futura" };
  if (stage === "cliente_ativo") return { status: "cliente_ativo", lead_status: null };
  if (stage === "desqualificado" || stage === "perdido") return { status: "desqualificado", lead_status: "desqualificado" };
  return { status: "qualificado", lead_status: "qualificado" };
}

function FunilPage() {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const { data: funnelItems = [] } = useQuery({
    queryKey: ["opps-kanban"],
    queryFn: async () => {
      const [{ data: opportunities }, { data: companies }] = await Promise.all([
        supabase
        .from("opportunities")
        .select("*, companies(name)")
          .neq("stage", "cliente_ativo")
          .order("updated_at", { ascending: false }),
        supabase
          .from("companies")
          .select("id, name, status, lead_status, service_of_interest, main_pain, updated_at")
          .in("status", LEAD_COMPANY_STATUSES)
          .order("updated_at", { ascending: false }),
      ]);

      const companyIdsWithOpportunity = new Set((opportunities ?? []).map((o) => o.company_id));
      const opportunityCards: FunnelItem[] = (opportunities ?? []).map((o) => ({
        dragId: `opportunity:${o.id}`,
        source: "opportunity",
        id: o.id,
        company_id: o.company_id,
        companyName: o.companies?.name ?? "",
        name: o.name,
        annual_value: o.annual_value,
        probability: o.probability,
        service_of_interest: o.service_of_interest,
        main_pain: o.main_pain,
        stage: o.stage,
      }));
      const companyCards: FunnelItem[] = (companies ?? [])
        .filter((c) => !companyIdsWithOpportunity.has(c.id))
        .map((c) => ({
          dragId: `company:${c.id}`,
          source: "company",
          id: c.id,
          company_id: c.id,
          companyName: c.name,
          name: c.name,
          annual_value: null,
          probability: null,
          service_of_interest: c.service_of_interest,
          main_pain: c.main_pain,
          stage: companyStage(c),
        }));

      return [...opportunityCards, ...companyCards];
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ item, from, to }: { item: FunnelItem; from: Stage; to: Stage }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const companyPatch = companyPatchForStage(to);
      let opportunityId = item.id;

      if (item.source === "opportunity") {
        const { error } = await supabase.from("opportunities").update({ stage: to }).eq("id", item.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("opportunities")
          .insert({
            company_id: item.company_id,
            name: `${PIPELINE_STAGE_LABELS[to]} - ${item.companyName}`,
            annual_value: item.annual_value,
            service_of_interest: item.service_of_interest,
            main_pain: item.main_pain,
            stage: to,
            created_by: user?.id,
            owner_id: user?.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        opportunityId = data.id;
      }

      const { error: companyError } = await supabase
        .from("companies")
        .update(companyPatch as never)
        .eq("id", item.company_id);
      if (companyError) throw companyError;

      await supabase.from("pipeline_stage_changes").insert({
        opportunity_id: opportunityId,
        from_stage: from,
        to_stage: to,
        changed_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Etapa atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scrollBoard = (direction: -1 | 1) => {
    boardRef.current?.scrollBy({ left: direction * 560, behavior: "smooth" });
  };

  return (
    <div className="h-[calc(100dvh-3.5rem)] min-h-0 flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Funil comercial</h1>
          <p className="text-sm text-muted-foreground">Arraste os cards para mover de etapa</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBoard(-1)}
            className="h-9 w-9 rounded-md border bg-card inline-flex items-center justify-center hover:bg-muted"
            aria-label="Rolar funil para a esquerda"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBoard(1)}
            className="h-9 w-9 rounded-md border bg-card inline-flex items-center justify-center hover:bg-muted"
            aria-label="Rolar funil para a direita"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={boardRef} className="min-h-0 flex-1 flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pr-1 kanban-board">
        {PIPELINE_STAGES.map((stage) => {
          const items = funnelItems.filter((o) => o.stage === stage);
          const sum = items.reduce((s, x) => s + Number(x.annual_value || 0), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const dragId = e.dataTransfer.getData("text/funnel-id");
                const from = e.dataTransfer.getData("text/from") as Stage;
                const item = funnelItems.find((x) => x.dragId === dragId);
                if (item && from !== stage) updateStage.mutate({ item, from, to: stage });
              }}
              className={`h-full min-h-0 shrink-0 w-72 rounded-lg border bg-muted/30 p-2 kanban-col flex flex-col transition-colors ${
                dragOver === stage ? "bg-accent/10 border-accent" : ""
              }`}
            >
              <div className="shrink-0 bg-muted/95 backdrop-blur px-2 py-2 mb-2 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">{PIPELINE_STAGE_LABELS[stage]}</div>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">{brl(sum)}</div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-4">
                {items.map((o) => (
                  <Card
                    key={o.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/funnel-id", o.dragId);
                      e.dataTransfer.setData("text/from", o.stage);
                    }}
                    className="p-2.5 cursor-grab active:cursor-grabbing hover:border-accent transition-colors"
                  >
                    <div className="text-sm font-medium truncate">{o.name}</div>
                    {o.companyName && (
                      <Link
                        to="/empresas/$id"
                        params={{ id: o.company_id }}
                        className="text-xs text-muted-foreground hover:underline block truncate"
                      >
                        {o.source === "company" ? "Lead sem oportunidade" : o.companyName}
                      </Link>
                    )}
                    {o.service_of_interest && (
                      <div className="text-xs text-muted-foreground truncate">Serviço: {o.service_of_interest}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                      <span>{brl(Number(o.annual_value))}/ano</span>
                      {o.probability != null && (
                        <Badge variant="outline" className="text-[10px] px-1">
                          {o.probability}%
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
