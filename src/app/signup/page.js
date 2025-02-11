import { PasswordSignupForm } from '@/components/sign-up-form';
import { AccessGate } from '@/components/access-gate';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function SignUpPage() {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');
  const env = process.env.NODE_ENV;
  const awaitingMFASetupAfterSignupCookie = cookies().get(
    'awaiting-mfa-setup-after-signup'
  );
  console.log('awaitingMFA', awaitingMFASetupAfterSignupCookie);
  const awaitingEmailVerificationAfterSignupCookie = cookies().get(
    'awaiting-email-verification-after-signup'
  );
  const usernamePasswordRegisteredCookie = cookies().get(
    'username-password-registered'
  );
  console.log(usernamePasswordRegisteredCookie);

  let progressionPoint;
  if (awaitingEmailVerificationAfterSignupCookie) {
    progressionPoint = 'emailVerification';
  }

  if (awaitingMFASetupAfterSignupCookie) {
    progressionPoint = 'mfaRegistration';
  }

  console.log('progressionPoint', progressionPoint);

  if (
    !awaitingMFASetupAfterSignupCookie &&
    !awaitingEmailVerificationAfterSignupCookie &&
    usernamePasswordRegisteredCookie
  ) {
    redirect('/signin');
  }

  return (
    <>
      {env === 'production' ? (
        <AccessGate nonce={nonce}>
          <PasswordSignupForm
            nonce={nonce}
            progressionPoint={progressionPoint}
          />
        </AccessGate>
      ) : (
        <PasswordSignupForm nonce={nonce} progressionPoint={progressionPoint} />
      )}
    </>
  );
}
