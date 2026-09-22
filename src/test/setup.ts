// Feste Zeitzone, damit Datums- und Streak-Tests reproduzierbar laufen
// (inklusive der Zeitumstellungen in Europe/Vienna).
process.env.TZ ??= 'Europe/Vienna';

import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
