import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio CMS — Mohit Babariya",
};

export default async function AdminPage() {
  const admin = await getCurrentAdmin().catch(() => null);

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminShell admin={admin} />;
}

