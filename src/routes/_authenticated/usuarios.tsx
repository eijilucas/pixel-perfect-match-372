import { createFileRoute } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { Copy, KeyRound, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "lucas@hinfros.com.br")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const assertAdmin = async (supabase: { auth: { getUser: () => Promise<{ data: { user: { email?: string | null } | null }; error: Error | null }> } }) => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) throw new Error("Sessão inválida.");

  const email = data.user.email.toLowerCase();
  if (!adminEmails().includes(email)) {
    throw new Error("Você não tem permissão para gerenciar usuários.");
  }

  return email;
};

const listUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(error.message);

    return data.users.map((user) => ({
      id: user.id,
      email: user.email ?? "",
      name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      confirmedAt: user.confirmed_at ?? null,
    }));
  });

const createUserSchema = z.object({
  email: z.string().email("E-mail inválido").transform((email) => email.trim().toLowerCase()),
  fullName: z.string().trim().min(2, "Informe o nome").max(120, "Nome muito longo"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(128, "Senha muito longa"),
});

const createUserFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

    if (error) throw new Error(error.message);

    return {
      id: created.user?.id ?? "",
      email: created.user?.email ?? data.email,
    };
  });

const updateUserPasswordSchema = z.object({
  userId: z.string().uuid("Usuário inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(128, "Senha muito longa"),
});

const updateUserPasswordFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => updateUserPasswordSchema.parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });

    if (error) throw new Error(error.message);

    return {
      id: updated.user?.id ?? data.userId,
      email: updated.user?.email ?? "",
    };
  });

function UsuariosPage() {
  const listUsers = useServerFn(listUsersFn);
  const createUser = useServerFn(createUserFn);
  const updateUserPassword = useServerFn(updateUserPasswordFn);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(() => generateTemporaryPassword());
  const [newUserPassword, setNewUserPassword] = useState(() => generateTemporaryPassword());

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
    retry: false,
  });

  const orderedUsers = useMemo(
    () => [...(usersQuery.data ?? [])].sort((a, b) => a.email.localeCompare(b.email, "pt-BR")),
    [usersQuery.data],
  );

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword(generateTemporaryPassword());
  };

  const openPasswordDialog = (user: { id: string; email: string; name: string }) => {
    setSelectedUser(user);
    setNewUserPassword(generateTemporaryPassword());
    setPasswordOpen(true);
  };

  const mutation = useMutation({
    mutationFn: () => createUser({ data: { fullName, email, password } }),
    onSuccess: ({ email: createdEmail }) => {
      toast.success(`Usuário criado: ${createdEmail}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error("Selecione um usuário.");
      return updateUserPassword({ data: { userId: selectedUser.id, password: newUserPassword } });
    },
    onSuccess: ({ email: updatedEmail }) => {
      toast.success(`Senha alterada: ${updatedEmail || selectedUser?.email || "usuário"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setPasswordOpen(false);
      setSelectedUser(null);
      setNewUserPassword(generateTemporaryPassword());
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Acessos do CRM</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) resetForm();
            setOpen(nextOpen);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail *</Label>
                <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Senha temporária *</Label>
                <div className="flex gap-2">
                  <Input required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Gerar senha"
                    onClick={() => setPassword(generateTemporaryPassword())}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Copiar senha"
                    onClick={() => copyPassword(password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Copie a senha antes de salvar e envie ao usuário por um canal seguro.</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Criando..." : "Criar usuário"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedUser?.name || selectedUser?.email || "este usuário"}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              passwordMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Nova senha *</Label>
              <div className="flex gap-2">
                <Input
                  required
                  minLength={8}
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Gerar senha"
                  onClick={() => setNewUserPassword(generateTemporaryPassword())}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copiar senha"
                  onClick={() => copyPassword(newUserPassword)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Copie e envie a nova senha ao usuário por um canal seguro.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Alterando..." : "Alterar senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {usersQuery.isError ? (
        <Card className="p-4">
          <p className="font-medium">Não foi possível carregar os usuários.</p>
          <p className="text-sm text-muted-foreground mt-1">{usersQuery.error.message}</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : orderedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhum usuário.</TableCell></TableRow>
              ) : orderedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name || user.email}</div>
                    {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.confirmedAt ? "secondary" : "outline"}>
                      {user.confirmedAt ? "Ativo" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(user.lastSignInAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openPasswordDialog(user)}
                    >
                      <KeyRound className="h-4 w-4 mr-1" />
                      Senha
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function generateTemporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => chars[value % chars.length]).join("");
}

async function copyPassword(password: string) {
  try {
    await navigator.clipboard.writeText(password);
    toast.success("Senha copiada");
  } catch {
    toast.error("Não foi possível copiar");
  }
}
