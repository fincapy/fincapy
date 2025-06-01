import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Parse state to get source and other data
  let stateData = { source: 'signup' }; // Default to signup for backwards compatibility
  if (state) {
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      // If state is not in our expected format, check if it's the old high_risk_action state
      if (state === 'high_risk_action') {
        stateData = { source: 'signin', isHighRiskAction: true };
      }
    }
  }

  const isHighRiskActionFlow =
    stateData.isHighRiskAction || state === 'high_risk_action';
  const source = stateData.source || 'signup';
  const redirectPage = source === 'signin' ? '/signin' : '/signup';

  if (error) {
    console.log('Google OAuth error:', error);
    return redirect(`${redirectPage}?error=oauth_error`);
  }

  if (!code) {
    console.log('No authorization code received');
    return redirect(`${redirectPage}?error=oauth_error`);
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI ||
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.log('Failed to exchange code for token');
      return redirect(`${redirectPage}?error=oauth_error`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.log('Failed to get user info from Google');
      return redirect(`${redirectPage}?error=oauth_error`);
    }

    const googleUser = await userResponse.json();

    if (!googleUser.email || !googleUser.verified_email) {
      console.log('Email not verified or missing from Google account');
      return redirect(`${redirectPage}?error=email_not_verified`);
    }

    const redisAdapter = new RedisAdapter({ redisClient });
    const userRepository = new UserRepository({ redisAdapter });

    // Check if user already exists
    const existingUser = await userRepository.getByEmail({
      email: googleUser.email,
    });

    if (existingUser) {
      // Check if the existing user was created with email/password
      // Default to 'email' for backwards compatibility with legacy accounts
      const userAuthProvider = existingUser.authProvider || 'email';

      if (userAuthProvider === 'email') {
        console.log(
          'User attempted Google OAuth with email/password account - initiating merge flow:',
          googleUser.email
        );

        // Create a secure token containing Google user data for the merge process
        const googleMergeToken = jwt.sign(
          {
            type: 'googleAccountMerge',
            googleUserData: {
              email: googleUser.email,
              name: googleUser.name || googleUser.given_name,
              verified_email: googleUser.verified_email,
            },
            existingUserId: existingUser.id,
            existingUserTenantId: existingUser.tenantId,
          },
          process.env.JWT_SECRET,
          { expiresIn: '10m', algorithm: 'HS256' } // Short-lived for security
        );

        (await cookies()).set('googleAccountMergeToken', googleMergeToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 10, // 10 minutes
        });

        return redirect('/merge-accounts');
      }

      // User exists and was created with Google
      if (isHighRiskActionFlow) {
        // For high risk actions, we need to verify this is the current session user
        const sessionRepository = new SessionRepository({ redisAdapter });
        const sessionManager = new SessionManager({ sessionRepository });

        try {
          const session = await sessionManager.getSession({
            cookies: await cookies(),
          });

          if (!session || session.userId !== existingUser.id) {
            console.log('High risk action attempted by non-matching user');
            return redirect('/app?error=authentication_mismatch&page=account');
          }

          // Create high risk action validated token
          const jti = crypto.randomUUID();
          const highRiskActionValidatedToken = jwt.sign(
            {
              userId: existingUser.id,
              tenantId: existingUser.tenantId,
              type: 'highRiskActionValidated',
              jti,
            },
            process.env.JWT_SECRET,
            { expiresIn: '5m', algorithm: 'HS256' }
          );

          (await cookies()).set(
            'highRiskActionValidatedToken',
            highRiskActionValidatedToken,
            {
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 5, // 5 minutes
            }
          );

          // Redirect back to the app - the frontend should detect the token and continue
          return redirect('/app?auth=success&page=account');
        } catch (error) {
          // Re-throw NEXT_REDIRECT errors so Next.js can handle them properly
          if (error.message === 'NEXT_REDIRECT') {
            throw error;
          }

          console.log('Error during high risk action authentication:', error);
          return redirect('/app?error=authentication_failed&page=account');
        }
      } else {
        // Regular sign-in flow
        const sessionRepository = new SessionRepository({ redisAdapter });
        const sessionManager = new SessionManager({ sessionRepository });

        try {
          const session = await sessionManager.createSession({
            userId: existingUser.id,
            tenantId: existingUser.tenantId,
            userRole: existingUser.role,
            cookies: await cookies(),
          });

          const sessionToken = jwt.sign(
            { sessionId: session.sessionId, type: 'session' },
            process.env.JWT_SECRET,
            { expiresIn: '3h', algorithm: 'HS256' }
          );

          (await cookies()).set('session-id', sessionToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 3, // 3 hours
          });

          return redirect('/app');
        } catch (error) {
          // Re-throw NEXT_REDIRECT errors so Next.js can handle them properly
          if (error.message === 'NEXT_REDIRECT') {
            throw error;
          }

          console.log(
            'Session creation error during Google SSO sign-in:',
            error
          );
          return redirect(`${redirectPage}?error=session_error`);
        }
      }
    } else {
      // New user, only allow account creation if not in high risk action flow
      if (isHighRiskActionFlow) {
        console.log('High risk action attempted for non-existent user');
        return redirect(`${redirectPage}?error=account_not_found`);
      }

      const transactionManager = new TransactionManager();
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });

      const userId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const randomPassword = crypto.randomBytes(32).toString('hex'); // Generate random password for Google users

      await setupNewTenantService.execute({
        tenantId,
        userId,
        name: googleUser.name || googleUser.given_name || 'Google User',
        email: googleUser.email,
        password: randomPassword,
        whitelistBilling: true,
        emailVerified: true, // Google emails are already verified
        authProvider: 'google', // Mark as Google-created account
      });

      // Create session directly since email is already verified
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });

      try {
        const session = await sessionManager.createSession({
          userId,
          tenantId,
          userRole: 'owner',
          cookies: await cookies(),
        });

        const sessionToken = jwt.sign(
          { sessionId: session.sessionId, type: 'session' },
          process.env.JWT_SECRET,
          { expiresIn: '3h', algorithm: 'HS256' }
        );

        (await cookies()).set('session-id', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 3, // 3 hours
        });

        return redirect('/app');
      } catch (error) {
        // Re-throw NEXT_REDIRECT errors so Next.js can handle them properly
        if (error.message === 'NEXT_REDIRECT') {
          throw error;
        }

        console.log('Session creation error during Google SSO signup:', error);
        return redirect(`${redirectPage}?error=session_error`);
      }
    }
  } catch (error) {
    // Re-throw NEXT_REDIRECT errors so Next.js can handle them properly
    if (error.message === 'NEXT_REDIRECT') {
      throw error;
    }

    console.error('Google OAuth callback error:', error);
    if (isHighRiskActionFlow) {
      return redirect('/app?error=oauth_error&page=account');
    } else {
      return redirect(`${redirectPage}?error=oauth_error`);
    }
  }
}
