# Bar 3 Client

This is the web interface for [Bar 3](https://github.com/TheonlyGlaernisch/bar3-server). It is written in Vue and is built using a framework called Vuetify.
**If you are looking to use Bar 3, you need to use the link above.**

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Required server-side changes (bar3-server)

The following two changes are needed in `TheonlyGlaernisch/bar3-server` to make the
**Dashboard** fully functional for v2 (MongoDB-backed) users.

### 1 – Persist v2 automation sent-messages per user (`src/services/v2AutomationRunner.ts`)

The automation runner stores sent messages in the global `messages.sentMessages` singleton,
but `/api/appData` reads from the per-user `state.userKeys[pwKey].sentMessages` store.
Add the snippet below inside the per-account send loop, after `messagesService.sendMessageWithConfig()`:

```typescript
// At the top of the file, import state:
import state from '../services/state';

// After the sendMessageWithConfig call inside the per-account loop:
const msg = await messagesService.sendMessageWithConfig(configLike, nation).catch(() => undefined);
if (msg) {
  // Ensure a per-user session slot exists and push the message so /api/appData returns it.
  if (!state.userKeys[pwKey]) {
    state.userKeys[pwKey] = { sentMessages: [], config: new Config(), applicationOn: false, apiDetails: { used: 0, max: 0 } };
  }
  state.userKeys[pwKey].sentMessages.push(msg);
}
seen.add(nation.nation_id);
sentThisTick++;
```

### 2 – Per-user API usage in `/api/appData` (`src/services/state.ts` + `src/api/index.ts`)

The global `state.requestsUsed` / `state.requestsMax` counters are only updated by the
legacy single-user search loop, so they are always `0` for v2 users.

**Option A (recommended):** Store per-user API details in `UserKeyState` and populate them
from the P&W GraphQL response after each automation tick:

```typescript
// state.ts – extend UserKeyState:
interface UserKeyState {
  sentMessages: unknown[];
  config: Config;
  applicationOn: boolean;
  apiDetails: { used: number; max: number }; // add this
}

// In ensureSession(), initialise the new field:
state.userKeys[apiKey] = {
  sentMessages: [],
  config: sessionConfig,
  applicationOn: false,
  apiDetails: { used: 0, max: 0 }, // add this
};

// In /api/appData route (src/api/index.ts), return per-user details:
apiDetails: scopedSession.apiDetails ?? { used: state.requestsUsed, max: state.requestsMax },
```

Then in `v2AutomationRunner.ts`, after each tick for a given user, query P&W GraphQL to
refresh `state.userKeys[pwKey].apiDetails`.

**Note:** The client already has a fallback — when the server returns `{used:0, max:0}` it
queries the P&W GraphQL API directly. The server fix is still recommended so that the value
is accurate even when the browser cannot reach `api.politicsandwar.com`.

