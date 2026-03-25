"use client";

import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-60 p-4 lg:p-8 pb-20 lg:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
