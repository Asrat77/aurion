const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
let csrfTokenPromise: Promise<string> | null = null;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
};

function newIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `aurion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function csrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_URL}/security/csrf`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to initialize request security.");
        const body = await res.json() as { csrfToken?: string };
        return body.csrfToken ?? "";
      })
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = options.body ? { "Content-Type": "application/json" } : {};
  if (method !== "GET") {
    headers["X-CSRF-Token"] = await csrfToken();
    headers["Idempotency-Key"] = options.idempotencyKey ?? newIdempotencyKey();
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("aurion:unauthorized"));
    const message = (data && (data.message || data.error)) || res.statusText || "Request failed";
    throw new ApiError(res.status, message, data?.errors);
  }

  return data as T;
}
