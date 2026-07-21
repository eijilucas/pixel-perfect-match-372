import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CompanyDialog } from "@/components/company-dialog";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_STATUS, CONTACT_ROLE, INTERACTION_TYPE, PIPELINE_STAGE_LABELS } from "@/lib/crm-labels";
import { brl, formatDateTime, waLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/empresas/$id")({
  component: CompanyDetail,
});

type ContactLite = { id: string; name: string };

type OpportunityLite = {
  id: string;
  name: string;
  primary_contact_id: string | null;
  monthly_value: number | null;
  annual_value: number | null;
  service_of_interest: string | null;
  stage: keyof typeof PIPELINE_STAGE_LABELS;
};

type CompanyServiceLite = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  monthly_value: number | null;
  annual_value: number | null;
  status: string;
  storage: "company_services" | "opportunity";
};

function isMissingCompanyServicesTable(error: { code?: string; message?: string } | null) {
  return error?.code === "PGRST205" || error?.message?.includes("company_services");
}

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
    queryFn: async () =>
      (await supabase.from("opportunities").select("*").eq("company_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: services = [] } = useQuery({
    queryKey: ["company-services", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_services")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false });

      if (!error) {
        return (data ?? []).map((service) => ({
          ...service,
          storage: "company_services" as const,
        }));
      }

      if (!isMissingCompanyServicesTable(error)) throw error;

      const { data: legacy, error: legacyError } = await supabase
        .from("opportunities")
        .select("id, company_id, name, service_of_interest, monthly_value, annual_value, created_at")
        .eq("company_id", id)
        .eq("stage", "cliente_ativo")
        .order("created_at", { ascending: false });
      if (legacyError) throw legacyError;

      return (legacy ?? []).map((service) => ({
        id: service.id,
        company_id: service.company_id,
        name: service.service_of_interest || service.name.replace(/^Contrato ativo - /, ""),
        description: null,
        monthly_value: service.monthly_value,
        annual_value: service.annual_value,
        status: "ativo",
        storage: "opportunity" as const,
      }));
    },
  });
  const { data: history = [] } = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () =>
      (await supabase.from("interactions").select("*").eq("company_id", id).order("occurred_at", { ascending: false })).data ?? [],
  });

  if (!company) return <div className="p-6">Carregando...</div>;

  const visibleOpps = opps.filter((o) => o.stage !== "cliente_ativo") as OpportunityLite[];

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
            {company.segment && <span>- {company.segment}</span>}
            {(company.city || company.state) && <span>- {[company.city, company.state].filter(Boolean).join(" / ")}</span>}
          </div>
        </div>
        <CompanyDialog
          initial={company}
          trigger={<Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" /> Editar</Button>}
        />
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Servicos contratados</CardTitle>
          <ServiceDialog
            companyId={id}
            trigger={<Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Servico</Button>}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum servico contratado informado.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="border rounded-md p-3 text-sm flex justify-between items-center flex-wrap gap-3">
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {service.status === "ativo" ? "Ativo" : "Inativo"} - {brl(Number(service.annual_value))}/ano
                  </div>
                  {service.description && <div className="text-xs text-muted-foreground mt-1">{service.description}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <ServiceDialog
                    companyId={id}
                    initial={service}
                    trigger={
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Editar servico ${service.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteServiceButton companyId={id} serviceId={service.id} serviceName={service.name} storage={service.storage} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Diagnostico Hinfros</CardTitle></CardHeader>
          <CardContent className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
            <Info label="Pode parar?" value={company.can_stop} />
            <Info label="Backup" value={company.has_backup} />
            <Info label="Nuvem" value={company.uses_cloud} />
            <Info label="Suporte atual" value={company.has_support} />
            <Info label="Contrato de TI" value={company.has_it_contract} />
            <Info label="Urgencia" value={company.urgency} />
            <Info label="Colaboradores" value={company.employees_count} />
            <Info label="Usuarios de TI" value={company.it_users_count} />
            <Info label="Risco principal" value={company.main_risk} full />
            <Info label="Objetivo" value={company.main_goal} full />
            <Info label="Dor principal" value={company.main_pain} full />
            <Info label="Servico de interesse" value={company.service_of_interest} full />
            {company.notes && <Info label="Observacoes" value={company.notes} full />}
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{c.name}</div>
                    <ContactDialog
                      companyId={id}
                      initial={c}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Editar contato ${c.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
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
          {visibleOpps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma oportunidade.</p>
          ) : visibleOpps.map((o) => (
            <div key={o.id} className="border rounded-md p-3 text-sm flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="font-medium">{o.name}</div>
                {o.service_of_interest && (
                  <div className="text-xs text-muted-foreground">Servico: {o.service_of_interest}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {PIPELINE_STAGE_LABELS[o.stage]} - {brl(Number(o.annual_value))}/ano
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{o.probability ?? 0}%</Badge>
                <OpportunityDialog
                  companyId={id}
                  contacts={contacts}
                  initial={o}
                  trigger={
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Editar oportunidade ${o.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Historico</CardTitle>
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

function ContactDialog({
  companyId,
  initial,
  trigger,
}: {
  companyId: string;
  initial?: {
    id: string;
    name: string;
    role_title: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    decision_role: string | null;
  };
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [roleTitle, setRoleTitle] = useState(initial?.role_title ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [role, setRole] = useState<string>(initial?.decision_role ?? "");
  const queryClient = useQueryClient();

  const resetForm = () => {
    setName(initial?.name ?? "");
    setRoleTitle(initial?.role_title ?? "");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
    setWhatsapp(initial?.whatsapp ?? "");
    setRole(initial?.decision_role ?? "");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: companyId,
        name,
        role_title: roleTitle || null,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        decision_role: (role || null) as never,
      };
      const { error } = initial?.id
        ? await supabase.from("contacts").update(payload).eq("id", initial.id)
        : await supabase.from("contacts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(initial?.id ? "Contato atualizado" : "Contato adicionado");
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      setOpen(false);
      if (!initial?.id) {
        setName("");
        setRoleTitle("");
        setEmail("");
        setPhone("");
        setWhatsapp("");
        setRole("");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) resetForm();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? "Editar contato" : "Novo contato"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Cargo</Label><Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Papel na decisao</Label>
            <Select value={role || "none"} onValueChange={(v) => setRole(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
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

function ServiceDialog({
  companyId,
  initial,
  trigger,
}: {
  companyId: string;
  initial?: CompanyServiceLite;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [monthly, setMonthly] = useState(initial?.monthly_value?.toString() ?? "");
  const [annual, setAnnual] = useState(initial?.annual_value?.toString() ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "ativo");
  const queryClient = useQueryClient();

  const resetForm = () => {
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setMonthly(initial?.monthly_value?.toString() ?? "");
    setAnnual(initial?.annual_value?.toString() ?? "");
    setStatus(initial?.status ?? "ativo");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const annualValue = annual ? Number(annual) : monthly ? Number(monthly) * 12 : null;
      const payload = {
        name,
        company_id: companyId,
        description: description || null,
        monthly_value: monthly ? Number(monthly) : null,
        annual_value: annualValue,
        status,
        created_by: initial?.id ? undefined : user?.id,
        owner_id: initial?.id ? undefined : user?.id,
      };

      if (initial?.storage === "opportunity") {
        const { error } = await supabase
          .from("opportunities")
          .update({
            name: `Contrato ativo - ${name}`,
            monthly_value: payload.monthly_value,
            annual_value: payload.annual_value,
            service_of_interest: name,
            stage: "cliente_ativo",
            probability: 100,
          })
          .eq("id", initial.id);
        if (error) throw error;
        return;
      }

      const { error } = initial?.id
        ? await supabase.from("company_services").update(payload).eq("id", initial.id)
        : await supabase.from("company_services").insert(payload);

      if (!error) return;
      if (!isMissingCompanyServicesTable(error)) throw error;

      const { error: legacyError } = await supabase.from("opportunities").insert({
        company_id: companyId,
        name: `Contrato ativo - ${name}`,
        monthly_value: payload.monthly_value,
        annual_value: payload.annual_value,
        service_of_interest: name,
        stage: "cliente_ativo",
        probability: 100,
        created_by: user?.id,
        owner_id: user?.id,
      });
      if (legacyError) throw legacyError;
    },
    onSuccess: () => {
      toast.success(initial?.id ? "Servico atualizado" : "Servico criado");
      queryClient.invalidateQueries({ queryKey: ["company-services", companyId] });
      queryClient.invalidateQueries({ queryKey: ["opportunities-company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
      if (!initial?.id) {
        setName("");
        setDescription("");
        setMonthly("");
        setAnnual("");
        setStatus("ativo");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) resetForm();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Servico</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? "Editar servico" : "Novo servico"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Servico *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: M365, Backup, Suporte TI" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descricao</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Mensal (R$)</Label><Input type="number" step="0.01" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Anual (R$)</Label><Input type="number" step="0.01" value={annual} onChange={(e) => setAnnual(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Status do servico</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteServiceButton({
  companyId,
  serviceId,
  serviceName,
  storage,
}: {
  companyId: string;
  serviceId: string;
  serviceName: string;
  storage: CompanyServiceLite["storage"];
}) {
  const queryClient = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = storage === "opportunity"
        ? await supabase.from("opportunities").delete().eq("id", serviceId)
        : await supabase.from("company_services").delete().eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Servico removido");
      queryClient.invalidateQueries({ queryKey: ["company-services", companyId] });
      queryClient.invalidateQueries({ queryKey: ["opportunities-company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={`Remover servico ${serviceName}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover servico?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso remove "{serviceName}" da lista de servicos contratados deste cliente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function OpportunityDialog({
  companyId,
  contacts,
  initial,
  trigger,
}: {
  companyId: string;
  contacts: ContactLite[];
  initial?: OpportunityLite;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [monthly, setMonthly] = useState(initial?.monthly_value?.toString() ?? "");
  const [annual, setAnnual] = useState(initial?.annual_value?.toString() ?? "");
  const [stage, setStage] = useState<string>(initial?.stage ?? "novo_lead");
  const [contactId, setContactId] = useState<string>(initial?.primary_contact_id ?? "");
  const [service, setService] = useState(initial?.service_of_interest ?? "");
  const queryClient = useQueryClient();

  const resetForm = () => {
    setName(initial?.name ?? "");
    setMonthly(initial?.monthly_value?.toString() ?? "");
    setAnnual(initial?.annual_value?.toString() ?? "");
    setStage(initial?.stage ?? "novo_lead");
    setContactId(initial?.primary_contact_id ?? "");
    setService(initial?.service_of_interest ?? "");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const payload = {
        name,
        company_id: companyId,
        primary_contact_id: contactId || null,
        monthly_value: monthly ? Number(monthly) : null,
        annual_value: annual ? Number(annual) : monthly ? Number(monthly) * 12 : null,
        service_of_interest: service || null,
        stage: stage as never,
        created_by: initial?.id ? undefined : user?.id,
        owner_id: initial?.id ? undefined : user?.id,
      };
      const { error } = initial?.id
        ? await supabase.from("opportunities").update(payload).eq("id", initial.id)
        : await supabase.from("opportunities").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(initial?.id ? "Oportunidade atualizada" : "Oportunidade criada");
      queryClient.invalidateQueries();
      setOpen(false);
      if (!initial?.id) {
        setName("");
        setMonthly("");
        setAnnual("");
        setStage("novo_lead");
        setContactId("");
        setService("");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) resetForm();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Oportunidade</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Nome *</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Servico de interesse</Label><Input value={service} onChange={(e) => setService(e.target.value)} /></div>
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
              <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("interactions").insert({
        company_id: companyId,
        type: type as never,
        summary,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro adicionado");
      onSaved();
      setOpen(false);
      setSummary("");
      setType("nota");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Registrar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar interacao</DialogTitle></DialogHeader>
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
