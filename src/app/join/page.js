import { SetPasswordForm } from '@/components/set-password-form';
import { headers, cookies } from 'next/headers';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from 'lucide-react';
import jwt from 'jsonwebtoken';

export default async function JoinPage(props) {
  const searchParams = await props.searchParams;
  const { token } = searchParams;
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return 'Invalid or expired invitation link';
  }
  if (verifiedToken.type !== 'inviteUser') {
    return 'Invalid or expired invitation link';
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Fincapy
        </a>
        <SetPasswordForm token={token} />
      </div>
    </div>
  );
}
