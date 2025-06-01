export async function GET(request) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  // Create state parameter with high risk action flag and signin source
  const stateData = { source: 'signin', isHighRiskAction: true };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return Response.redirect(googleAuthUrl);
}
