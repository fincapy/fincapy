import { GET } from '@/app/api/auth/google/high-risk-action/route';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Google OAuth High Risk Action Initiation API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.NODE_ENV = 'development';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  describe('OAuth URL generation for high risk actions', () => {
    it('should redirect to Google OAuth URL with high_risk_action state parameter', async () => {
      const request = new Request(
        'http://localhost:3000/api/auth/google/high-risk-action'
      );

      const response = await GET(request);

      expect(response.status).toBe(302);

      const location = response.headers.get('Location');
      expect(location).toContain(
        'https://accounts.google.com/o/oauth2/v2/auth'
      );
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain(
        'redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fgoogle%2Fcallback'
      );
      expect(location).toContain('response_type=code');
      expect(location).toContain('scope=openid+email+profile');
      expect(location).toContain('access_type=offline');
      expect(location).toContain('prompt=consent');

      // Check for the new base64 encoded state format
      expect(location).toContain('state=');
      const stateMatch = location.match(/state=([^&]+)/);
      expect(stateMatch).toBeTruthy();

      // Decode and verify the state contains high risk action data
      const stateData = JSON.parse(
        Buffer.from(decodeURIComponent(stateMatch[1]), 'base64').toString()
      );
      expect(stateData).toEqual({ source: 'signin', isHighRiskAction: true });
    });

    it('should use custom redirect URI when GOOGLE_REDIRECT_URI is set', async () => {
      process.env.GOOGLE_REDIRECT_URI =
        'https://custom.domain.com/oauth/callback';

      const request = new Request(
        'http://localhost:3000/api/auth/google/high-risk-action'
      );

      const response = await GET(request);

      const location = response.headers.get('Location');
      expect(location).toContain(
        'redirect_uri=https%3A%2F%2Fcustom.domain.com%2Foauth%2Fcallback'
      );

      // Check for the new base64 encoded state format
      expect(location).toContain('state=');
      const stateMatch = location.match(/state=([^&]+)/);
      expect(stateMatch).toBeTruthy();

      // Decode and verify the state contains high risk action data
      const stateData = JSON.parse(
        Buffer.from(decodeURIComponent(stateMatch[1]), 'base64').toString()
      );
      expect(stateData).toEqual({ source: 'signin', isHighRiskAction: true });
    });
  });
});
