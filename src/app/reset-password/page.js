import { SetPasswordForm } from '@/components/set-password-form';
import { headers, cookies } from 'next/headers';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from 'lucide-react';
import jwt from 'jsonwebtoken';
import Image from 'next/image';

export default async function ResetPasswordPage(props) {
  const searchParams = await props.searchParams;
  const { token } = searchParams;
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    return 'Invalid or expired reset password link';
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center">
          <Image
            src="/capybara.png"
            alt="Fincapy"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <SetPasswordForm token={token} isReset={true} />
      </div>
    </div>
  );
}
