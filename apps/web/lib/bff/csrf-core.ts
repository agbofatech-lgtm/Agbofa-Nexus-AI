export const CSRF_COOKIE = "agbofa_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function newCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function tokensMatch(cookieValue: string, headerValue: string): boolean {
  if (!cookieValue || !headerValue) return false;
  if (cookieValue.length !== headerValue.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieValue.length; i += 1) {
    mismatch |= cookieValue.charCodeAt(i) ^ headerValue.charCodeAt(i);
  }
  return mismatch === 0;
}
