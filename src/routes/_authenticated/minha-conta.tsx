import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  component: MinhaContaPage,
});

function MinhaContaPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) {
        throw new Error("A nova senha precisa ter pelo menos 8 caracteres.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("A confirmação não bate com a nova senha.");
      }

      if (currentPassword === newPassword) {
        throw new Error("A nova senha precisa ser diferente da senha atual.");
      }

      const { data, error: userError } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (userError || !email) throw new Error("Não conseguimos confirmar seu usuário.");

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (loginError) throw new Error("Senha atual inválida.");

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="p-6 space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Minha conta</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu acesso ao CRM</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Alterando..." : "Alterar senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
