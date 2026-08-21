/**
 * DEVELOPMENT / TEST compliance rule engine.
 * Not legal certification, not comprehensive PII, not jurisdiction-aware.
 *
 * Supported detections: explicit prohibited phrase; simple email; US-SSN-like \d{3}-\d{2}-\d{4}.
 * Known false positives: any text containing those patterns.
 * Known false negatives / unsupported: phone, address, passport, national IDs, images, multilingual PII.
 */

export const COMPLIANCE_SAFE_FIXTURE = "DEV_TRUTH_FIXTURE: local observation";

const PROHIBITED = ["prohibited:unlicensed-medical-claim", "bypass compliance"];
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;

export class ComplianceUnavailable extends Error {
  readonly code = "COMPLIANCE_UNAVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "ComplianceUnavailable";
  }
}

export type ComplianceResult = { ok: boolean; error?: ComplianceUnavailable };

export class DevComplianceEngine {
  readonly kind = "DEVELOPMENT_POLICY_ENGINE";

  check(text: string): ComplianceResult {
    const trimmed = (text ?? "").trim();
    if (!trimmed) return { ok: false, error: new ComplianceUnavailable("empty content cannot be checked") };
    const lower = trimmed.toLowerCase();
    if (PROHIBITED.some((p) => lower.includes(p))) return { ok: false };
    if (EMAIL.test(trimmed) || SSN.test(trimmed)) return { ok: false };
    return { ok: true };
  }
}
