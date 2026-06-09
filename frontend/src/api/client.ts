const BASE = '/api'

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('czat-umowy-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.user?.access_token ?? null
  } catch {
    return null
  }
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(init?.headers),
    ...init,
  })
  if (res.status === 401) {
    // Token wygasł — wyczyść auth i przeładuj
    localStorage.removeItem('czat-umowy-auth')
    window.location.reload()
    throw new Error('Sesja wygasła')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Błąd serwera')
  }
  return res.json()
}

export function apiStream(path: string, body: object): ReadableStreamDefaultReader<Uint8Array> {
  const token = getToken()
  const controller = new AbortController()
  const req = fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const res = await req
      if (!res.ok || !res.body) { ctrl.close(); return }
      const reader = res.body.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) { ctrl.close(); break }
          ctrl.enqueue(value)
        }
      } catch {
        ctrl.close()
      }
    },
    cancel() { controller.abort() },
  })
  return stream.getReader()
}
