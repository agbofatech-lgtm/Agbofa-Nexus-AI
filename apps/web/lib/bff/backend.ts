const backendURL = () =>
  process.env.AGBOFA_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://127.0.0.1:8080";

export async function backendRPC<T>(
  method: string,
  body: unknown,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const response = await fetch(`${backendURL()}${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
}
