/** DEVELOPMENT / TEST Truth engine. Not internet fact-checking. UNKNOWN ≠ TRUE. */

export const TRUTH_SAFE_FIXTURE = "DEV_TRUTH_FIXTURE: local observation";

const DENIED = ["the earth is flat", "2+2=5", "known-false:"];

export class TruthUnavailable extends Error {
  readonly code = "TRUTH_UNAVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "TruthUnavailable";
  }
}

export type TruthResult = { ok: boolean; error?: TruthUnavailable };

export class DevTruthEngine {
  readonly kind = "DEVELOPMENT_RULE_ENGINE";

  verify(text: string): TruthResult {
    const trimmed = (text ?? "").trim();
    if (!trimmed) return { ok: false, error: new TruthUnavailable("empty input cannot be verified") };
    const lower = trimmed.toLowerCase();
    if (DENIED.some((d) => lower.includes(d))) return { ok: false };
    if (trimmed === TRUTH_SAFE_FIXTURE) return { ok: true };
    return { ok: false, error: new TruthUnavailable("claim is unknown to the development rule engine") };
  }
}
