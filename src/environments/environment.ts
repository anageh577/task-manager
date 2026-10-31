export const environment = {
  production: true,
  /**
   * Relative base URL. The dev server and nginx proxy this to json-server.
   * The Firebase Hosting build sends these calls to Realtime Database instead.
   */
  apiUrl: '/api',
  /** How long GET responses are served from the HTTP cache. */
  cacheTtlMs: 30_000,
  /** Retry policy for idempotent requests. */
  retry: { count: 2, initialDelayMs: 500 },
  databaseUrl: null,
};
