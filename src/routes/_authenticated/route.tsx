import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { applyTheme, getStoredTheme, storeTheme, type AppTheme } from "@/lib/theme";
import { useEffect } from "react";

const hinfrosLogo = "/hinfros-logo.png";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useEffect(() => {
    applyTheme(getStoredTheme());
    supabase.auth.getUser().then(({ data }) => {
      const theme = data.user?.user_metadata?.theme;
      if ((theme === "dark" || theme === "light") && !localStorage.getItem("hinfros-theme")) {
        storeTheme(theme as AppTheme);
      }
    });
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-card px-4">
            <SidebarTrigger />
            <img src={hinfrosLogo} alt="Hinfros" className="h-7 w-28 object-contain object-left md:hidden" />
            <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
              Hinfros CRM
            </div>
          </header>
          <main className="flex-1 min-w-0 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
