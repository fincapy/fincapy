// server component that purely redirects to the /app/spending page
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect('/app/spending');
  } else {
    redirect('/');
  }
}
