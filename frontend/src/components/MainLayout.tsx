"use client";

import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import TopBar from "./TopBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <Sidebar />
      <div className="flex-1 lg:ml-[208px] flex flex-col">
        <TopBar />
        <main className="flex-1 p-4 pt-[72px] lg:p-6 lg:pt-[72px] pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
