import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyDialog } from "@/components/company-dialog";
import { useState } from "react";
import { COMPANY_STATUS, PRIORITY } from "@/lib/crm-labels";
import { formatDate } from "@/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/empresas")({
  component: EmpresasPage,
});

function EmpresasPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todos");

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", status, q],
    queryFn: async () => {
      let query = supabase.from("companies").select("*").order("updated_at", { ascending: false });
      if (status !== "todos") query = query.eq("status", status as never);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">Base central de leads, prospects e clientes</p>
        </div>
        <CompanyDialog />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip active={status === "todos"} onClick={() => setStatus("todos")}>Todos</FilterChip>
          {Object.entries(COMPANY_STATUS).map(([k, v]) => (
            <FilterChip key={k} active={status === k} onClick={() => setStatus(k)}>{v}</FilterChip>
          ))}
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prior.</TableHead>
              <TableHead>Atualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhuma empresa encontrada.</TableCell></TableRow>
            ) : companies.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell>
                  <Link to="/empresas/$id" params={{ id: c.id }} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.segment ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{[c.city, c.state].filter(Boolean).join(" / ") || "—"}</TableCell>
                <TableCell><Badge variant="outline">{COMPANY_STATUS[c.status]}</Badge></TableCell>
                <TableCell><Badge variant={c.priority === "alta" ? "destructive" : "secondary"}>{PRIORITY[c.priority ?? "media"]}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(c.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
