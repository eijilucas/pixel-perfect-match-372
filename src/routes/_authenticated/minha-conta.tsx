import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { applyTheme, getStoredTheme, storeTheme, type AppTheme } from "@/lib/theme";
import { Camera, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  component: MinhaContaPage,
});

function MinhaContaPage() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState<AppTheme>(() => getStoredTheme());
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const profileQuery = useQuery({
    queryKey: ["my-account"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw new Error("Não conseguimos carregar seu usuário.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", data.user.id)
        .maybeSingle();

      return {
        id: data.user.id,
        email: data.user.email ?? profile?.email ?? "",
        fullName:
          typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name
            ? data.user.user_metadata.full_name
            : profile?.full_name ?? "",
        avatarUrl: typeof data.user.user_metadata?.avatar_url === "string" ? data.user.user_metadata.avatar_url : "",
        theme:
          data.user.user_metadata?.theme === "dark" || data.user.user_metadata?.theme === "light"
            ? (data.user.user_metadata.theme as AppTheme)
            : getStoredTheme(),
        metadata: data.user.user_metadata ?? {},
      };
    },
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.fullName);
    setEmail(profileQuery.data.email);
    setAvatarUrl(profileQuery.data.avatarUrl);
    setTheme(profileQuery.data.theme);
    storeTheme(profileQuery.data.theme);
  }, [profileQuery.data]);

  const displayName = useMemo(() => fullName || email || "Usuário", [email, fullName]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!profileQuery.data) throw new Error("Perfil ainda não carregado.");
      const cleanName = fullName.trim();
      if (cleanName.length < 2) throw new Error("Informe seu nome.");

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: profileQuery.data.id,
        email,
        full_name: cleanName,
      });
      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...profileQuery.data.metadata,
          full_name: cleanName,
          avatar_url: avatarUrl,
          theme,
        },
      });
      if (authError) throw authError;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const themeMutation = useMutation({
    mutationFn: async (nextTheme: AppTheme) => {
      setTheme(nextTheme);
      storeTheme(nextTheme);
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) throw new Error("Não conseguimos salvar o tema.");
      const { error } = await supabase.auth.updateUser({
        data: {
          ...(data.user.user_metadata ?? {}),
          theme: nextTheme,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tema atualizado");
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
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
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Minha conta</h1>
        <p className="text-sm text-muted-foreground">Perfil, aparência e segurança</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  profileMutation.mutate();
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="text-lg">{initials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Foto</Label>
                    <div>
                      <Button type="button" variant="outline" asChild>
                        <label htmlFor="avatar" className="cursor-pointer">
                          <Camera className="h-4 w-4 mr-2" />
                          Escolher foto
                        </label>
                      </Button>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            setAvatarUrl(await resizeAvatar(file));
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Não foi possível carregar a foto");
                          } finally {
                            event.target.value = "";
                          }
                        }}
                      />
                    </div>
                    {avatarUrl && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setAvatarUrl("")}>
                        Remover foto
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="full-name">Nome</Label>
                    <Input
                      id="full-name"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} disabled />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={profileMutation.isPending || profileQuery.isLoading}>
                    {profileMutation.isPending ? "Salvando..." : "Salvar perfil"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aparência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => themeMutation.mutate("light")}
                  className={`rounded-md border p-4 text-left transition-colors ${theme === "light" ? "border-primary bg-muted" : "hover:bg-muted/60"}`}
                >
                  <Sun className="h-5 w-5 mb-3" />
                  <div className="font-medium">Claro</div>
                  <div className="text-sm text-muted-foreground">Interface branca para uso diário.</div>
                </button>
                <button
                  type="button"
                  onClick={() => themeMutation.mutate("dark")}
                  className={`rounded-md border p-4 text-left transition-colors ${theme === "dark" ? "border-primary bg-muted" : "hover:bg-muted/60"}`}
                >
                  <Moon className="h-5 w-5 mb-3" />
                  <div className="font-medium">Escuro</div>
                  <div className="text-sm text-muted-foreground">Interface escura para ambientes com pouca luz.</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alterar senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  passwordMutation.mutate();
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
                  <Button type="submit" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? "Alterando..." : "Alterar senha"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function resizeAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Escolha uma imagem válida."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
      img.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (dataUrl.length > 900_000) {
          reject(new Error("A imagem ficou muito grande. Tente outra foto."));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
