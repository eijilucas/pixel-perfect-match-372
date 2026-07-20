import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  COMPANY_STATUS,
  COMPANY_ORIGIN,
  PRIORITY,
  LEAD_STATUS,
  DISQUALIFICATION_REASONS,
} from "@/lib/crm-labels";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type CompanyRow = {
  id?: string;
  name: string;
  cnpj: string | null;
  segment: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  employees_count: number | null;
  it_users_count: number | null;
  status: keyof typeof COMPANY_STATUS;
  lead_status: keyof typeof LEAD_STATUS | null;
  origin: keyof typeof COMPANY_ORIGIN | null;
  priority: keyof typeof PRIORITY | null;
  owner_id: string | null;
  notes: string | null;
  can_stop: "sim" | "nao" | "nao_sei" | null;
  has_backup: "sim" | "nao" | "parcial" | "nao_sei" | null;
  uses_cloud: "sim" | "nao" | "parcial" | "nao_sei" | null;
  has_support: "sim" | "nao" | "nao_sei" | null;
  has_it_contract: "sim" | "nao" | "nao_sei" | null;
  main_risk: string | null;
  main_goal: string | null;
  urgency: "baixo" | "medio" | "alto" | null;
  main_pain: string | null;
  service_of_interest: string | null;
  disqualification_reason: string | null;
  future_opportunity_reason: string | null;
  best_return_date: string | null;
};

const empty: CompanyRow = {
  name: "", cnpj: null, segment: null, city: null, state: null, website: null,
  employees_count: null, it_users_count: null, status: "lead", lead_status: "novo",
  origin: null, priority: "media", owner_id: null, notes: null,
  can_stop: null, has_backup: null, uses_cloud: null, has_support: null, has_it_contract: null,
  main_risk: null, main_goal: null, urgency: null,
  main_pain: null, service_of_interest: null,
  disqualification_reason: null, future_opportunity_reason: null, best_return_date: null,
};

export function CompanyDialog({
  trigger,
  initial,
  onSaved,
}: {
  trigger?: React.ReactNode;
  initial?: Partial<CompanyRow> & { id?: string };
  onSaved?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [row, setRow] = useState<CompanyRow>({ ...empty, ...initial });
  const queryClient = useQueryClient();

  const { data: profiles } = useQuery({
    queryKey: ["profiles-min"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data ?? [];
    },
  });

  const mut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...row, created_by: initial?.id ? undefined : user?.id };
      if (initial?.id) {
        const { data, error } = await supabase.from("companies").update(payload).eq("id", initial.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("companies").insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (d) => {
      toast.success(initial?.id ? "Empresa atualizada" : "Empresa criada");
      queryClient.invalidateQueries();
      setOpen(false);
      if (!initial?.id) setRow(empty);
      onSaved?.(d.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova empresa</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar empresa" : "Nova empresa"}</DialogTitle>
          <DialogDescription>Cadastro consultivo — preencha o que já sabe.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="space-y-4"
        >
          <Section title="Identificação">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome da empresa *" className="col-span-2">
                <Input required value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} />
              </Field>
              <Field label="CNPJ"><Input value={row.cnpj ?? ""} onChange={(e) => setRow({ ...row, cnpj: e.target.value || null })} /></Field>
              <Field label="Segmento"><Input value={row.segment ?? ""} onChange={(e) => setRow({ ...row, segment: e.target.value || null })} /></Field>
              <Field label="Cidade"><Input value={row.city ?? ""} onChange={(e) => setRow({ ...row, city: e.target.value || null })} /></Field>
              <Field label="Estado"><Input maxLength={2} value={row.state ?? ""} onChange={(e) => setRow({ ...row, state: e.target.value.toUpperCase() || null })} /></Field>
              <Field label="Site" className="col-span-2"><Input value={row.website ?? ""} onChange={(e) => setRow({ ...row, website: e.target.value || null })} /></Field>
              <Field label="Colaboradores"><Input type="number" value={row.employees_count ?? ""} onChange={(e) => setRow({ ...row, employees_count: e.target.value ? +e.target.value : null })} /></Field>
              <Field label="Usuários de TI"><Input type="number" value={row.it_users_count ?? ""} onChange={(e) => setRow({ ...row, it_users_count: e.target.value ? +e.target.value : null })} /></Field>
            </div>
          </Section>

          <Section title="Comercial">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <EnumSelect value={row.status} onChange={(v) => setRow({ ...row, status: v as CompanyRow["status"] })} options={COMPANY_STATUS} />
              </Field>
              <Field label="Status do lead">
                <EnumSelect value={row.lead_status ?? ""} onChange={(v) => setRow({ ...row, lead_status: (v || null) as CompanyRow["lead_status"] })} options={LEAD_STATUS} nullable />
              </Field>
              <Field label="Origem">
                <EnumSelect value={row.origin ?? ""} onChange={(v) => setRow({ ...row, origin: (v || null) as CompanyRow["origin"] })} options={COMPANY_ORIGIN} nullable />
              </Field>
              <Field label="Prioridade">
                <EnumSelect value={row.priority ?? "media"} onChange={(v) => setRow({ ...row, priority: v as CompanyRow["priority"] })} options={PRIORITY} />
              </Field>
              <Field label="Responsável" className="col-span-2">
                <Select value={row.owner_id ?? "none"} onValueChange={(v) => setRow({ ...row, owner_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sem responsável —</SelectItem>
                    {profiles?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Qualificação e diagnóstico">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serviço de interesse"><Input value={row.service_of_interest ?? ""} onChange={(e) => setRow({ ...row, service_of_interest: e.target.value || null })} /></Field>
              <Field label="Dor principal"><Input value={row.main_pain ?? ""} onChange={(e) => setRow({ ...row, main_pain: e.target.value || null })} /></Field>
              <Field label="A operação pode parar?">
                <EnumSelect value={row.can_stop ?? ""} onChange={(v) => setRow({ ...row, can_stop: (v || null) as CompanyRow["can_stop"] })} options={{ sim: "Sim", nao: "Não", nao_sei: "Não sei" }} nullable />
              </Field>
              <Field label="Possui backup?">
                <EnumSelect value={row.has_backup ?? ""} onChange={(v) => setRow({ ...row, has_backup: (v || null) as CompanyRow["has_backup"] })} options={{ sim: "Sim", nao: "Não", parcial: "Parcial", nao_sei: "Não sei" }} nullable />
              </Field>
              <Field label="Usa nuvem?">
                <EnumSelect value={row.uses_cloud ?? ""} onChange={(v) => setRow({ ...row, uses_cloud: (v || null) as CompanyRow["uses_cloud"] })} options={{ sim: "Sim", nao: "Não", parcial: "Parcial", nao_sei: "Não sei" }} nullable />
              </Field>
              <Field label="Possui suporte atual?">
                <EnumSelect value={row.has_support ?? ""} onChange={(v) => setRow({ ...row, has_support: (v || null) as CompanyRow["has_support"] })} options={{ sim: "Sim", nao: "Não", nao_sei: "Não sei" }} nullable />
              </Field>
              <Field label="Contrato de TI hoje?">
                <EnumSelect value={row.has_it_contract ?? ""} onChange={(v) => setRow({ ...row, has_it_contract: (v || null) as CompanyRow["has_it_contract"] })} options={{ sim: "Sim", nao: "Não", nao_sei: "Não sei" }} nullable />
              </Field>
              <Field label="Urgência">
                <EnumSelect value={row.urgency ?? ""} onChange={(v) => setRow({ ...row, urgency: (v || null) as CompanyRow["urgency"] })} options={{ baixo: "Baixo", medio: "Médio", alto: "Alto" }} nullable />
              </Field>
              <Field label="Risco percebido" className="col-span-2"><Input value={row.main_risk ?? ""} onChange={(e) => setRow({ ...row, main_risk: e.target.value || null })} /></Field>
              <Field label="Objetivo com infraestrutura" className="col-span-2"><Input value={row.main_goal ?? ""} onChange={(e) => setRow({ ...row, main_goal: e.target.value || null })} /></Field>
              <Field label="Melhor data de retorno"><Input type="date" value={row.best_return_date ?? ""} onChange={(e) => setRow({ ...row, best_return_date: e.target.value || null })} /></Field>
              <Field label="Motivo (desqualificação / futura)">
                <Select value={row.disqualification_reason ?? "none"} onValueChange={(v) => setRow({ ...row, disqualification_reason: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {DISQUALIFICATION_REASONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Observações">
            <Textarea rows={3} value={row.notes ?? ""} onChange={(e) => setRow({ ...row, notes: e.target.value || null })} />
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function EnumSelect({
  value,
  onChange,
  options,
  nullable,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Record<string, string>;
  nullable?: boolean;
}) {
  return (
    <Select value={value || (nullable ? "__none" : "")} onValueChange={(v) => onChange(v === "__none" ? "" : v)}>
      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>
        {nullable && <SelectItem value="__none">—</SelectItem>}
        {Object.entries(options).map(([k, v]) => (
          <SelectItem key={k} value={k}>{v}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
