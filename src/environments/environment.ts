export const environment = {
  production: true,
  /** Relative base URL: proxied to json-server by the dev-server (proxy.conf.json) and nginx (Docker). */
  apiUrl: '/api',
  /** How long GET responses are served from the HTTP cache. */
  cacheTtlMs: 30_000,
  /** Retry policy for idempotent requests. */
  retry: { count: 2, initialDelayMs: 500 },
};
