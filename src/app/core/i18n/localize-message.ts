import { userMessageFor } from '@core/http/api-error';

/** Maps the English messages produced by the HTTP layer onto translation keys. */
const MESSAGE_KEYS: Record<string, string> = {
  [userMessageFor(0)]: 'error.offline',
  [userMessageFor(404)]: 'error.notFound',
  [userMessageFor(409)]: 'error.conflict',
  [userMessageFor(422)]: 'error.rejected',
  [userMessageFor(500)]: 'error.server',
  'Something went wrong. Please try again.': 'error.unknown',
};

export function translationKeyForMessage(message: string): string | null {
  return MESSAGE_KEYS[message] ?? null;
}
