import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {
  const session = await getSession();

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const user = session.user;
  if (user.billing_status !== 'active') {
    redirect('https://buy.stripe.com/test_6oEeVmgk19t71moeUU');
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
