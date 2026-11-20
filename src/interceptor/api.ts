import axios, { AxiosError } from "axios";

/** Normalised error thrown by every API call, with optional per-field messages for forms. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; fields?: Record<string, string> }>) => {
    if (err.response) {
      const { status, data } = err.response;
      return Promise.reject(new ApiClientError(data?.error ?? "Request failed. Please try again.", status, data?.fields));
    }
    const message = err.code === "ECONNABORTED" ? "The request timed out. Please try again." : "Can't reach the server. Check your connection.";
    return Promise.reject(new ApiClientError(message, 0));
  }
);

type Envelope<T> = { ok: true; data: T };

/** Thin typed helpers that unwrap the `{ ok, data }` envelope. */
export const api = {
  get: async <T>(url: string, params?: object) => (await http.get<Envelope<T>>(url, { params })).data.data,
  post: async <T>(url: string, body?: unknown) => (await http.post<Envelope<T>>(url, body)).data.data,
  put: async <T>(url: string, body?: unknown) => (await http.put<Envelope<T>>(url, body)).data.data,
  patch: async <T>(url: string, body?: unknown) => (await http.patch<Envelope<T>>(url, body)).data.data,
  delete: async <T>(url: string) => (await http.delete<Envelope<T>>(url)).data.data,
  upload: async (file: File, folder: string, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await http.post<Envelope<{ url: string; publicId: string; width: number; height: number }>>("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
    return res.data.data;
  },
};

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong.";
}
