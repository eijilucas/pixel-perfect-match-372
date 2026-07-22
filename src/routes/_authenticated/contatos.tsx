import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTACT_ROLE } from "@/lib/crm-labels";
import { waLink } from "@/lib/format";
import { useState, type ReactNode } from "react";
import { MessageCircle, Search, Mail, Phone, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contatos")({
  component: ContatosPage,
});

function ContatosPage() {
  const [q, setQ] = useState("");
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts-all", q],
    queryFn: async () => {
      let query = supabase.from("contacts").select("*, companies(id,name)").order("name");
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contatos</h1>
          <p className="text-sm text-muted-foreground">Pessoas vinculadas às empresas</p>
        </div>
        <ContactDialog
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Novo contato
            </Button>
          }
        />
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome..." className="pl-9" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo / Papel</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">Nenhum contato.</TableCell></TableRow>
            ) : contacts.map((c) => {
              const wa = waLink(c.whatsapp || c.phone);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">
                    {c.role_title}
                    {c.decision_role && <Badge variant="secondary" className="ml-2 text-xs">{CONTACT_ROLE[c.decision_role]}</Badge>}
                  </TableCell>
                  <TableCell>
                    {c.companies && (
                      <Link to="/empresas/$id" params={{ id: c.companies.id }} className="text-sm hover:underline">
                        {c.companies.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground space-y-1">
                    {c.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</div>}
                    {c.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</div>}
                  </TableCell>
                  <TableCell>
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="text-success inline-flex items-center gap-1 text-sm hover:underline">
                        <MessageCircle className="h-4 w-4" /> Abrir
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ContactDialog
                      contact={c}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Editar contato ${c.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

type ContactRow = {
  id: string;
  company_id: string;
  name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  decision_role: string | null;
};

function ContactDialog({ contact, trigger }: { contact?: ContactRow; trigger: ReactNode }) {
  const isEditing = Boolean(contact);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(contact?.name ?? "");
  const [companyId, setCompanyId] = useState(contact?.company_id ?? "");
  const [roleTitle, setRoleTitle] = useState(contact?.role_title ?? "");
  const [role, setRole] = useState(contact?.decision_role ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(contact?.whatsapp ?? "");
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-min"],
    queryFn: async () => (await supabase.from("companies").select("id,name").order("name")).data ?? [],
  });

  const resetForm = () => {
    setName(contact?.name ?? "");
    setCompanyId(contact?.company_id ?? "");
    setRoleTitle(contact?.role_title ?? "");
    setRole(contact?.decision_role ?? "");
    setEmail(contact?.email ?? "");
    setPhone(contact?.phone ?? "");
    setWhatsapp(contact?.whatsapp ?? "");
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Selecione uma empresa.");

      const payload = {
        company_id: companyId,
        name,
        role_title: roleTitle || null,
        decision_role: (role || null) as never,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
      };

      const { error } = contact
        ? await supabase.from("contacts").update(payload).eq("id", contact.id)
        : await supabase.from("contacts").insert(payload);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isEditing ? "Contato atualizado" : "Contato criado");
      queryClient.invalidateQueries({ queryKey: ["contacts-all"] });
      if (contact?.company_id) queryClient.invalidateQueries({ queryKey: ["contacts", contact.company_id] });
      if (companyId) queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
      setOpen(false);
      if (!isEditing) resetForm();
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEditing ? "Editar contato" : "Novo contato"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Empresa *</Label>
            <Select value={companyId} onValueChange={setCompanyId} required>
              <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cargo</Label>
            <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Papel na decisão</Label>
            <Select value={role || "none"} onValueChange={(v) => setRole(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {Object.entries(CONTACT_ROLE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
