import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  Users,
  UserCog,
  Kanban,
  CheckSquare,
  UserCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

const hinfrosLogoWhite = "/hinfros-logo-white.svg";
const hinfrosMarkWhite = "/hinfros-mark-white.svg";

const items = [
  { title: "Painel", url: "/painel", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Sparkles },
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Contatos", url: "/contatos", icon: Users },
  { title: "Funil", url: "/funil", icon: Kanban },
  { title: "Atividades", url: "/atividades", icon: CheckSquare },
  { title: "Usuários", url: "/usuarios", icon: UserCog },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      const fullName =
        typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name
          ? user.user_metadata.full_name
          : profile?.full_name || user.email || "Usuário";

      return {
        email: user.email ?? profile?.email ?? "",
        fullName,
        avatarUrl: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "",
      };
    },
    staleTime: 60_000,
  });

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center gap-2 py-2 ${collapsed ? "justify-center px-0" : "px-2"}`}>
          {collapsed ? (
            <img src={hinfrosMarkWhite} alt="Hinfros" className="h-7 w-7 object-contain" />
          ) : (
            <img src={hinfrosLogoWhite} alt="Hinfros" className="h-8 w-36 object-contain object-left" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Operação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem className={collapsed ? "flex justify-center" : undefined}>
            <SidebarMenuButton
              asChild
              isActive={isActive("/minha-conta")}
              tooltip="Minha conta"
              className={collapsed ? "!p-0 justify-center" : undefined}
            >
              <Link to="/minha-conta" className={`flex items-center ${collapsed ? "justify-center gap-0" : "gap-2"}`}>
                {currentUser ? (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={currentUser.avatarUrl} alt={currentUser.fullName} />
                    <AvatarFallback className="bg-sidebar-accent text-[10px] text-sidebar-accent-foreground">
                      {initials(currentUser.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircle className="h-4 w-4" />
                )}
                <span className={collapsed ? "sr-only" : "min-w-0 truncate"}>
                  {currentUser?.fullName ?? "Minha conta"}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className={collapsed ? "flex justify-center" : undefined}>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sair"
              className={collapsed ? "justify-center" : undefined}
            >
              <LogOut className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : undefined}>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
