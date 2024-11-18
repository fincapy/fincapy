import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full bg-stone-100">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
