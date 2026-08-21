export function csrfHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|; )agbofa_csrf=([^;]*)/);
  if (!match?.[1]) return {};
  return { "X-CSRF-Token": decodeURIComponent(match[1]) };
}
