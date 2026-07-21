import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyDialog } from "@/components/company-dialog";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_STATUS, PRIORITY } from "@/lib/crm-labels";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/empresas")({
  component: EmpresasPage,
});

type SortKey = "name" | "services" | "segment" | "city" | "status" | "priority" | "updated_at";
type SortDirection = "asc" | "desc";

const priorityRank = { alta: 0, media: 1, baixa: 2 };

function EmpresasPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "updated_at",
    direction: "desc",
  });
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const { data: companies = [] } = useQuery({
    queryKey: ["companies", status, q],
    queryFn: async () => {
      let query = supabase.from("companies").select("*").order("updated_at", { ascending: false });
      if (status !== "todos") query = query.eq("status", status as never);
      if (q) query = query.ilike("name", `%${q}%`);

      const [{ data: companyRows }, { data: services }] = await Promise.all([
        query,
        supabase
          .from("company_services")
          .select("company_id, name, updated_at")
          .order("updated_at", { ascending: false }),
      ]);

      let serviceRows =
        services?.map((service) => ({
          company_id: service.company_id,
          name: service.name,
        })) ?? [];

      if (!services) {
        const { data: legacyServices } = await supabase
          .from("opportunities")
          .select("company_id, name, service_of_interest, updated_at")
          .eq("stage", "cliente_ativo")
          .order("updated_at", { ascending: false });

        serviceRows = (legacyServices ?? []).map((service) => ({
          company_id: service.company_id,
          name: service.service_of_interest || service.name.replace(/^Contrato ativo - /, ""),
        }));
      }

      const servicesByCompany = new Map<string, string[]>();
      serviceRows.forEach((service) => {
        if (!service.name) return;
        const current = servicesByCompany.get(service.company_id) ?? [];
        if (!current.includes(service.name)) {
          servicesByCompany.set(service.company_id, [...current, service.name]);
        }
      });

      return (companyRows ?? []).map((company) => ({
        ...company,
        contracted_services: servicesByCompany.get(company.id) ?? [],
      }));
    },
  });

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      const aValue = sortValue(a, sort.key);
      const bValue = sortValue(b, sort.key);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue), "pt-BR", { numeric: true, sensitivity: "base" }) * direction;
    });
  }, [companies, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (pathname !== "/empresas") return <Outlet />;

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
          {Object.entries(COMPANY_STATUS).map(([key, label]) => (
            <FilterChip key={key} active={status === key} onClick={() => setStatus(key)}>{label}</FilterChip>
          ))}
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Empresa" sortKey="name" current={sort} onSort={toggleSort} />
              <SortableHead label="Serviços" sortKey="services" current={sort} onSort={toggleSort} />
              <SortableHead label="Segmento" sortKey="segment" current={sort} onSort={toggleSort} />
              <SortableHead label="Cidade/UF" sortKey="city" current={sort} onSort={toggleSort} />
              <SortableHead label="Status" sortKey="status" current={sort} onSort={toggleSort} />
              <SortableHead label="Prior." sortKey="priority" current={sort} onSort={toggleSort} />
              <SortableHead label="Atualizado" sortKey="updated_at" current={sort} onSort={toggleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma empresa encontrada.
                </TableCell>
              </TableRow>
            ) : sortedCompanies.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer h-12"
                tabIndex={0}
                onClick={() => navigate({ to: "/empresas/$id", params: { id: company.id } })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate({ to: "/empresas/$id", params: { id: company.id } });
                  }
                }}
              >
                <TableCell className="max-w-[280px]">
                  <Link
                    to="/empresas/$id"
                    params={{ id: company.id }}
                    className="block truncate font-medium hover:underline"
                    onClick={(event) => event.stopPropagation()}
                    title={company.name}
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="w-[240px] max-w-[240px]">
                  {company.contracted_services.length === 0 ? (
                    <span className="text-muted-foreground text-sm">-</span>
                  ) : (
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden" title={company.contracted_services.join(", ")}>
                      {company.contracted_services.slice(0, 2).map((service) => (
                        <Badge key={service} variant="secondary" className="max-w-[96px] shrink-0 truncate text-xs font-medium">
                          <span className="block truncate">{service}</span>
                        </Badge>
                      ))}
                      {company.contracted_services.length > 2 && (
                        <Badge variant="outline" className="shrink-0 text-xs font-medium">
                          +{company.contracted_services.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[190px] text-muted-foreground text-sm">
                  <span className="block truncate" title={company.segment ?? ""}>{company.segment ?? "-"}</span>
                </TableCell>
                <TableCell className="max-w-[190px] text-muted-foreground text-sm">
                  <span className="block truncate" title={[company.city, company.state].filter(Boolean).join(" / ")}>
                    {[company.city, company.state].filter(Boolean).join(" / ") || "-"}
                  </span>
                </TableCell>
                <TableCell><Badge variant="outline">{COMPANY_STATUS[company.status]}</Badge></TableCell>
                <TableCell>
                  <Badge variant={company.priority === "alta" ? "destructive" : "secondary"}>
                    {PRIORITY[company.priority ?? "media"]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(company.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function sortValue(
  company: {
    name: string;
    contracted_services: string[];
    segment: string | null;
    city: string | null;
    state: string | null;
    status: string;
    priority: string | null;
    updated_at: string;
  },
  key: SortKey,
) {
  if (key === "name") return company.name;
  if (key === "services") return company.contracted_services.join(" ");
  if (key === "segment") return company.segment ?? "";
  if (key === "city") return [company.city, company.state].filter(Boolean).join(" / ");
  if (key === "status") return COMPANY_STATUS[company.status as keyof typeof COMPANY_STATUS] ?? company.status;
  if (key === "priority") return priorityRank[(company.priority ?? "media") as keyof typeof priorityRank] ?? 99;
  return new Date(company.updated_at).getTime();
}

function SortableHead({
  label,
  sortKey,
  current,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: { key: SortKey; direction: SortDirection };
  onSort: (key: SortKey) => void;
}) {
  const active = current.key === sortKey;
  const Icon = active ? (current.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex h-8 items-center gap-1 rounded px-1.5 text-left text-xs font-medium transition-colors hover:bg-muted ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
        aria-label={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
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
