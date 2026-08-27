import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio CMS — Mohit Babariya",
};

export default async function AdminPage() {
  await ensureDatabase();
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminShell admin={admin} />;
}
