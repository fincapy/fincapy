'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';

function capitalize(word) {
  if (!word) return ''; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export default function Layout({ children }) {
  const path = usePathname();
  const pageName = path.split('/').pop();
  const capitalizedPageName = capitalize(pageName);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-5 mt-2">
              <SidebarTrigger className="ml-2" />
              <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {capitalizedPageName}
              </h1>
              <div className="flex flex-row justify-end flex-grow mr-2">
                <ModeToggle />
              </div>
            </div>
            <Separator />
          </div>
          {children}
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
