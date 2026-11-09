import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import AdminDashboard from '@/components/AdminDashboard';
export const dynamic='force-dynamic';
export default async function AdminPage(){const auth=await requireAdmin();if(!auth.ok)redirect('/admin/login');return <AdminDashboard email={auth.user.email||'Admin'}/>}
