import "@testing-library/jest-dom/vitest";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
  };
}

if (
  typeof window !== "undefined" &&
  typeof window.localStorage?.getItem !== "function"
) {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: createMemoryStorage(),
  });
}

if (typeof window !== "undefined") {
  class BrowserCompatibleRequest {
    readonly body: BodyInit | null;
    readonly headers: Headers;
    readonly method: string;
    readonly signal: AbortSignal;
    readonly url: string;

    constructor(input: RequestInfo | URL, init: RequestInit = {}) {
      this.url =
        typeof input === "string"
          ? new URL(input, window.location.href).href
          : input instanceof URL
            ? input.href
            : input.url;
      this.method = init.method ?? "GET";
      this.headers = new Headers(init.headers);
      this.body = init.body ?? null;
      this.signal = init.signal ?? new AbortController().signal;
    }
  }

  Object.defineProperty(globalThis, "Request", {
    configurable: true,
    value: BrowserCompatibleRequest,
  });
}
