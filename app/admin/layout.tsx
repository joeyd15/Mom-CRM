import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Lead Hub — Admin",
  description: "Real Estate AI Lead Management Platform",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = await getSession();
  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
