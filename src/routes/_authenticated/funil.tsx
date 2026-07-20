import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/crm-labels";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/funil")({
  component: FunilPage,
});

type Stage = (typeof PIPELINE_STAGES)[number];

function FunilPage() {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const { data: opps = [] } = useQuery({
    queryKey: ["opps-kanban"],
    queryFn: async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("*, companies(name)")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, from, to }: { id: string; from: Stage; to: Stage }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("opportunities").update({ stage: to }).eq("id", id);
      if (error) throw error;
      await supabase.from("pipeline_stage_changes").insert({
        opportunity_id: id, from_stage: from, to_stage: to, changed_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Etapa atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Funil comercial</h1>
        <p className="text-sm text-muted-foreground">Arraste os cards para mover de etapa</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const items = opps.filter(o => o.stage === stage);
          const sum = items.reduce((s, x) => s + Number(x.annual_value || 0), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/opp-id");
                const from = e.dataTransfer.getData("text/from") as Stage;
                if (id && from !== stage) updateStage.mutate({ id, from, to: stage });
              }}
              className={`shrink-0 w-64 rounded-lg border bg-muted/30 p-2 kanban-col transition-colors ${
                dragOver === stage ? "bg-accent/10 border-accent" : ""
              }`}
            >
              <div className="px-2 py-1 mb-2 flex items-center justify-between">
                <div className="text-xs font-medium">{PIPELINE_STAGE_LABELS[stage]}</div>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground px-2 mb-2">{brl(sum)}</div>
              <div className="space-y-2">
                {items.map((o) => (
                  <Card
                    key={o.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/opp-id", o.id);
                      e.dataTransfer.setData("text/from", o.stage);
                    }}
                    className="p-2.5 cursor-grab active:cursor-grabbing hover:border-accent transition-colors"
                  >
                    <div className="text-sm font-medium truncate">{o.name}</div>
                    {o.companies?.name && (
                      <Link to="/empresas/$id" params={{ id: o.company_id }} className="text-xs text-muted-foreground hover:underline block truncate">
                        {o.companies.name}
                      </Link>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                      <span>{brl(Number(o.annual_value))}/ano</span>
                      {o.probability != null && <Badge variant="outline" className="text-[10px] px-1">{o.probability}%</Badge>}
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
