import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  session: {
    cookie: {
      sameSite: 'none', // Required for cross-subdomain auth
      secure: process.env.NODE_ENV === 'production', // Enforce HTTPS in production
    },
  },
});
