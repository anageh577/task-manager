export const environment = {
  production: true,
  apiUrl: '/api',
  cacheTtlMs: 30_000,
  retry: { count: 2, initialDelayMs: 500 },
  /** Shared store for the Hosting deploy. Local and Docker builds leave this null. */
  databaseUrl: 'https://task-manager-f67c6-default-rtdb.firebaseio.com',
};
