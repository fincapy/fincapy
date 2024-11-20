import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@auth0/nextjs-auth0';

export default async function Layout({ children }) {
  const session = await getSession();

  console.log('session', session);

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const user = session.user;

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
