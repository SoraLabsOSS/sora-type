export interface CompareSession {
  createdAt: string;
  fontAKey: string;
  fontBKey: string;
  fontSize: number;
  id: string;
  lastAccessedAt: string;
}

export type SessionFontSlot = "a" | "b";

const TRAILING_SLASH = /\/$/;
const HAS_SCHEME = /^https?:\/\//;

export function getApiBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    return null;
  }
  if (!HAS_SCHEME.test(base)) {
    // Missing scheme resolves as a relative path against the current
    // origin instead of the API host — fail loudly instead of silently
    // hitting the wrong URL.
    console.error(
      `NEXT_PUBLIC_API_URL is missing "http(s)://": "${base}". Share sessions are disabled until this is fixed.`
    );
    return null;
  }
  return base.replace(TRAILING_SLASH, "");
}

export function sessionUrl(id: string): string | null {
  const base = getApiBaseUrl();
  return base ? `${base}/sessions/${id}` : null;
}

export function sessionFontUrl(
  id: string,
  slot: SessionFontSlot
): string | null {
  const base = getApiBaseUrl();
  return base ? `${base}/sessions/${id}/${slot}` : null;
}

export async function createCompareSession(
  formData: FormData
): Promise<CompareSession> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${base}/sessions`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // keep status message
    }
    throw new Error(message);
  }

  return response.json() as Promise<CompareSession>;
}

/** Absolute share URL for a compare session on the current site. */
export function buildCompareShareUrl(
  locale: string,
  sessionId: string
): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/${locale}/compare?s=${encodeURIComponent(sessionId)}`;
}
