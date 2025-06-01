import { headers, cookies } from 'next/headers';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Image from 'next/image';
import { MergeAccountsForm } from '@/components/merge-accounts-form';

export default async function MergeAccountsPage() {
  const cookiesList = await cookies();

  // Verify the Google merge token exists and is valid
  const googleAccountMergeToken = cookiesList.get('googleAccountMergeToken');
  if (!googleAccountMergeToken) {
    redirect('/signin?error=merge_token_missing');
  }

  let mergeTokenData;
  try {
    mergeTokenData = jwt.verify(
      googleAccountMergeToken.value,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );
  } catch (error) {
    redirect('/signin?error=merge_token_invalid');
  }

  if (mergeTokenData.type !== 'googleAccountMerge') {
    redirect('/signin?error=merge_token_invalid');
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
        <div className="flex flex-col items-center justify-center -mt-4 gap-4">
          <div className="flex flex-col items-center gap-0 mb-2">
            <h2 className="text-2xl text-center font-semibold tracking-tight">
              Merge Your Accounts
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2 max-w-sm">
              To link your Google account with your existing account, please
              sign in with your current credentials.
            </p>
          </div>
          <MergeAccountsForm
            googleUserEmail={mergeTokenData.googleUserData.email}
            googleUserName={mergeTokenData.googleUserData.name}
          />
        </div>
      </div>
    </div>
  );
}
