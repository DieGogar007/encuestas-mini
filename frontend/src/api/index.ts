const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '');

function getApiUrl() {
  if (!API_URL) {
    throw new Error('Configuracion faltante: NEXT_PUBLIC_API_URL');
  }
  return API_URL;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Error inesperado';
    try {
      const data = await response.json();
      if (Array.isArray(data?.message)) {
        message = data.message.join('. ');
      } else if (typeof data?.message === 'string') {
        message = data.message;
      }
    } catch {
      // noop
    }
    throw new Error(message);
  }

  return response.json();
}
