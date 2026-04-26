// ============================================================
// Clock Crew — Runtime Configuration
// ============================================================
// Imports defaults from secrets.js and overrides with production
// values when served from *.com
// ============================================================

import { CLOCK_CREW_PORT as SECRETS_PORT } from "./secrets.js";

export const PORT = SECRETS_PORT || 3000;

export const IS_PRODUCTION =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith(".com");

export const IS_LOCALHOST = !IS_PRODUCTION;

// Environment-aware project name — isolates data between dev and prod
export const PROJECT_NAME = "clock-crew";
