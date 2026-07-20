import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTACT_ROLE } from "@/lib/crm-labels";
import { waLink } from "@/lib/format";
import { useState } from "react";
import { MessageCircle, Search, Mail, Phone } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-semibold">Contatos</h1>
        <p className="text-sm text-muted-foreground">Pessoas vinculadas às empresas</p>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Nenhum contato.</TableCell></TableRow>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
