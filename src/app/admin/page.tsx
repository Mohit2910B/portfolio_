import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getCurrentAdmin } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio CMS — Mohit Babariya",
};

export default async function AdminPage() {
  try {
    await ensureDatabase();
  } catch (error) {
    console.warn(
      "[admin] Database bootstrap warning during admin page render:",
      error instanceof Error ? error.message : error,
    );
  }

  let admin = null;
  try {
    admin = await getCurrentAdmin();
  } catch (error) {
    console.warn(
      "[admin] Error fetching current admin session:",
      error instanceof Error ? error.message : error,
    );
  }

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminShell admin={admin} />;
}

