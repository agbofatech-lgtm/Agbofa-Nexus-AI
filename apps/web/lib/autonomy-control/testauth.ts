/** Non-production fixture only. Never a production credential. */
export const TEST_BEARER = "test-token-123";

export function allowPlaneTestAuth(env: string, planeTestAuth: boolean, token: string): boolean {
  if (!planeTestAuth) return false;
  if (env === "production" || env === "staging") return false;
  return token === TEST_BEARER;
}
