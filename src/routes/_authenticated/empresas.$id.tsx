import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CompanyDialog } from "@/components/company-dialog";
import { COMPANY_STATUS, CONTACT_ROLE, INTERACTION_TYPE, PIPELINE_STAGE_LABELS } from "@/lib/crm-labels";
import { brl, formatDateTime, waLink } from "@/lib/format";
import { ArrowLeft, Pencil, Plus, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/empresas/$id")({
  component: CompanyDetail,
});

function CompanyDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => (await supabase.from("companies").select("*").eq("id", id).single()).data,
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", id],
    queryFn: async () => (await supabase.from("contacts").select("*").eq("company_id", id).order("created_at")).data ?? [],
  });
  const { data: opps = [] } = useQuery({
    queryKey: ["opportunities-company", id],
    queryFn: async () => (await supabase.from("opportunities").select("*").eq("company_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: history = [] } = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () => (await supabase.from("interactions").select("*").eq("company_id", id).order("occurred_at", { ascending: false })).data ?? [],
  });

  if (!company) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/empresas" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Empresas
        </Link>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="outline">{COMPANY_STATUS[company.status]}</Badge>
            {company.segment && <span>· {company.segment}</span>}
            {(company.city || company.state) && <span>· {[company.city, company.state].filter(Boolean).join(" / ")}</span>}
          </div>
        </div>
        <CompanyDialog
          initial={company}
          trigger={<Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" /> Editar</Button>}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Diagnóstico Hinfros</CardTitle></CardHeader>
          <CardContent className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
            <Info label="Pode parar?" value={company.can_stop} />
            <Info label="Backup" value={company.has_backup} />
            <Info label="Nuvem" value={company.uses_cloud} />
            <Info label="Suporte atual" value={company.has_support} />
            <Info label="Contrato de TI" value={company.has_it_contract} />
            <Info label="Urgência" value={company.urgency} />
            <Info label="Colaboradores" value={company.employees_count} />
            <Info label="Usuários de TI" value={company.it_users_count} />
            <Info label="Risco principal" value={company.main_risk} full />
            <Info label="Objetivo" value={company.main_goal} full />
            <Info label="Dor principal" value={company.main_pain} full />
            <Info label="Serviço de interesse" value={company.service_of_interest} full />
            {company.notes && <Info label="Observações" value={company.notes} full />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Contatos</CardTitle>
            <ContactDialog companyId={id} />
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato.</p>
            ) : contacts.map((c) => {
              const wa = waLink(c.whatsapp || c.phone);
              return (
                <div key={c.id} className="border rounded-md p-2 text-sm">
                  <div className="font-medium">{c.name}</div>
                  {c.role_title && <div className="text-xs text-muted-foreground">{c.role_title}</div>}
                  {c.decision_role && <Badge variant="secondary" className="mt-1 text-xs">{CONTACT_ROLE[c.decision_role]}</Badge>}
                  <div className="text-xs text-muted-foreground mt-1">{c.email}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {c.phone || c.whatsapp}
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-success hover:underline">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Oportunidades</CardTitle>
          <OpportunityDialog companyId={id} contacts={contacts} />
        </CardHeader>
        <CardContent className="space-y-2">
          {opps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma oportunidade.</p>
          ) : opps.map((o) => (
            <div key={o.id} className="border rounded-md p-3 text-sm flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="font-medium">{o.name}</div>
                <div className="text-xs text-muted-foreground">
                  {PIPELINE_STAGE_LABELS[o.stage]} · {brl(Number(o.annual_value))}/ano
                </div>
              </div>
              <Badge variant="outline">{o.probability ?? 0}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Histórico</CardTitle>
          <InteractionDialog companyId={id} onSaved={() => queryClient.invalidateQueries({ queryKey: ["interactions", id] })} />
        </CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro.</p>
          ) : history.map((h) => (
            <div key={h.id} className="border-l-2 border-accent pl-3 py-1 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{INTERACTION_TYPE[h.type]}</Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(h.occurred_at)}</span>
              </div>
              <div className="mt-1 whitespace-pre-wrap">{h.summary}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: unknown; full?: boolean }) {
  if (value == null || value === "") return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{String(value)}</div>
    </div>
  );
}

function ContactDialog({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<string>("");
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").insert({
        company_id: companyId, name, role_title: roleTitle || null,
        email: email || null, phone: phone || null, whatsapp: whatsapp || null,
        decision_role: (role || null) as never,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contato adicionado");
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      setOpen(false); setName(""); setRoleTitle(""); setEmail(""); setPhone(""); setWhatsapp(""); setRole("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo contato</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Cargo</Label><Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Papel na decisão</Label>
            <Select value={role || "none"} onValueChange={(v) => setRole(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {Object.entries(CONTACT_ROLE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OpportunityDialog({ companyId, contacts }: { companyId: string; contacts: Array<{ id: string; name: string }> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [monthly, setMonthly] = useState("");
  const [annual, setAnnual] = useState("");
  const [stage, setStage] = useState<string>("novo_lead");
  const [contactId, setContactId] = useState<string>("");
  const [service, setService] = useState("");
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("opportunities").insert({
        name, company_id: companyId, primary_contact_id: contactId || null,
        monthly_value: monthly ? Number(monthly) : null,
        annual_value: annual ? Number(annual) : (monthly ? Number(monthly) * 12 : null),
        service_of_interest: service || null,
        stage: stage as never,
        created_by: user?.id, owner_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Oportunidade criada");
      queryClient.invalidateQueries();
      setOpen(false); setName(""); setMonthly(""); setAnnual(""); setStage("novo_lead"); setContactId(""); setService("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Oportunidade</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Serviço de interesse</Label><Input value={service} onChange={(e) => setService(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Mensal (R$)</Label><Input type="number" step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Anual (R$)</Label><Input type="number" step="0.01" value={annual} onChange={(e) => setAnnual(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Etapa</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PIPELINE_STAGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Contato principal</Label>
            <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InteractionDialog({ companyId, onSaved }: { companyId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("nota");
  const [summary, setSummary] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("interactions").insert({
        company_id: companyId, type: type as never, summary, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro adicionado");
      onSaved(); setOpen(false); setSummary(""); setType("nota");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Registrar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar interação</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INTERACTION_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Resumo *</Label><Textarea required rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
          <DialogFooter><Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
