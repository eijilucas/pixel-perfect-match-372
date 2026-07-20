import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyDialog } from "@/components/company-dialog";
import { LEAD_STATUS, COMPANY_STATUS } from "@/lib/crm-labels";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const queryClient = useQueryClient();
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-triage"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .in("status", ["lead", "qualificado", "oportunidade_futura", "desqualificado"])
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, lead_status, status }: { id: string; lead_status: string; status?: string }) => {
      const patch = status ? { lead_status, status } : { lead_status };
      const { error } = await supabase.from("companies").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const groups = {
    novo: leads.filter(l => (l.lead_status ?? "novo") === "novo"),
    em_contato: leads.filter(l => l.lead_status === "em_contato"),
    qualificado: leads.filter(l => l.lead_status === "qualificado"),
    oportunidade_futura: leads.filter(l => l.lead_status === "oportunidade_futura"),
    desqualificado: leads.filter(l => l.lead_status === "desqualificado"),
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">Triagem e qualificação</p>
        </div>
        <CompanyDialog />
      </div>

      <div className="grid gap-3">
        {(Object.keys(groups) as Array<keyof typeof groups>).map((k) => (
          <div key={k}>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
              {LEAD_STATUS[k]}
              <Badge variant="secondary">{groups[k].length}</Badge>
            </h3>
            <div className="grid gap-2">
              {groups[k].length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-2">Vazio</p>
              ) : groups[k].map((l) => (
                <Card key={l.id} className="p-3">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <Link to="/empresas/$id" params={{ id: l.id }} className="font-medium hover:underline">
                        {l.name}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate">
                        {[l.segment, l.city, l.state].filter(Boolean).join(" · ") || "—"}
                        {l.main_pain && <> · Dor: {l.main_pain}</>}
                      </div>
                      <div className="text-xs text-muted-foreground">Atualizado {formatDate(l.updated_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{COMPANY_STATUS[l.status]}</Badge>
                      <Select
                        value={l.lead_status ?? "novo"}
                        onValueChange={(v) => {
                          let statusUpdate: string | undefined;
                          if (v === "qualificado") statusUpdate = "qualificado";
                          if (v === "desqualificado") statusUpdate = "desqualificado";
                          if (v === "oportunidade_futura") statusUpdate = "oportunidade_futura";
                          updateLeadStatus.mutate({ id: l.id, lead_status: v, status: statusUpdate });
                        }}
                      >
                        <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(LEAD_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Link to="/empresas/$id" params={{ id: l.id }}>
                        <Button size="sm" variant="ghost">Abrir</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
