import Dashboard from '@/components/dashboard-page';
import { getSession } from '@auth0/nextjs-auth0';

export default async function DashboardPage() {
  const session = await getSession();

  if (session) {
    const user = session.user;
    console.log('user', user);
  }
  return <Dashboard />;
}
