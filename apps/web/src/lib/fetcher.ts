export interface HttpError extends Error {
  status: number;
}

function httpError(url: string, status: number): HttpError {
  const error = new Error(
    `Request to ${url} failed with status ${status}`
  ) as HttpError;
  error.status = status;
  return error;
}

export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw httpError(url, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);

  if (!response.ok) {
    throw httpError(url, response.status);
  }

  return response.arrayBuffer();
}
