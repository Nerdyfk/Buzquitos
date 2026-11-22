import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPuzzleDashboard } from "@/components/gtd/AdminPuzzleDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPuzzlePage() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login");
  }

  return <AdminPuzzleDashboard email={auth.user.email || "Admin"} />;
}
