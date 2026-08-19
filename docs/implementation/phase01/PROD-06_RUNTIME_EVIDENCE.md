# PROD-06 — BFF / Gateway Evidence

**Implementation:** COMPLETE  
**Runtime:** PENDING (`pnpm test` / `pnpm build` / live BFF not executed as Phase 01 certification)

BFF routes: `/api/v1/auth/login|logout|session`. SessionProvider no longer stores tokens in sessionStorage or fabricates demo success. Roles presented in UI are mapped from server JWT claims for display only.

Cryptographic JWT verification in the BFF still requires the developer runtime public key / ValidateToken path. Cookie is HttpOnly.

In-memory rate limiting is process-local (not Redis). Do not claim distributed rate limiting.
