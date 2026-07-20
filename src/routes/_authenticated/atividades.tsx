import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ACTIVITY_STATUS, ACTIVITY_TYPE } from "@/lib/crm-labels";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { useState } from "react";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/atividades")({
  component: AtividadesPage,
});

function AtividadesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("pendente");

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", filter],
    queryFn: async () => {
      let q = supabase.from("activities").select("*, companies(id,name)").order("due_date", { ascending: true, nullsFirst: false });
      if (filter !== "todas") q = q.eq("status", filter as never);
      const { data } = await q;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("activities").update({
        status: done ? "concluida" : "pendente",
        completed_at: done ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const now = new Date();

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Atividades</h1>
          <p className="text-sm text-muted-foreground">Tarefas comerciais</p>
        </div>
        <ActivityDialog />
      </div>

      <div className="flex gap-1">
        {["pendente", "concluida", "cancelada", "todas"].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-full border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
            {f === "todas" ? "Todas" : (ACTIVITY_STATUS[f as keyof typeof ACTIVITY_STATUS] ?? f)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade.</p>
        ) : activities.map(a => {
          const isLate = a.status === "pendente" && a.due_date && new Date(a.due_date) < now;
          return (
            <Card key={a.id} className="p-3 flex items-start gap-3">
              <Checkbox
                checked={a.status === "concluida"}
                onCheckedChange={(v) => toggle.mutate({ id: a.id, done: !!v })}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className={"font-medium " + (a.status === "concluida" ? "line-through text-muted-foreground" : "")}>{a.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                  <Badge variant="outline" className="text-xs">{ACTIVITY_TYPE[a.type]}</Badge>
                  {a.due_date && (
                    <span className={isLate ? "text-destructive font-medium" : ""}>
                      {isLate ? "Atrasada: " : "Vence: "}{formatDateTime(a.due_date)}
                    </span>
                  )}
                  {a.companies && (
                    <Link to="/empresas/$id" params={{ id: a.companies.id }} className="hover:underline">
                      · {a.companies.name}
                    </Link>
                  )}
                </div>
                {a.notes && <div className="text-sm text-muted-foreground mt-1">{a.notes}</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ActivityDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("follow_up");
  const [dueDate, setDueDate] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-min"],
    queryFn: async () => (await supabase.from("companies").select("id,name").order("name")).data ?? [],
  });

  const mut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("activities").insert({
        title, type: type as never, due_date: dueDate || null,
        company_id: companyId || null, notes: notes || null,
        created_by: user?.id, owner_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atividade criada");
      queryClient.invalidateQueries();
      setOpen(false); setTitle(""); setType("follow_up"); setDueDate(""); setCompanyId(""); setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova atividade</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Título *</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Vencimento</Label><Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Empresa</Label>
            <Select value={companyId || "none"} onValueChange={(v) => setCompanyId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Observações</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <DialogFooter><Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
