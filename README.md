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

Three files in `TheonlyGlaernisch/bar3-server` need to be edited to make the **Dashboard**
fully functional for v2 (MongoDB-backed) users. Apply them in the order shown below.

> **Note on analytics:** `src/api/routers/v2/analytics.ts` already returns full
> `clickHistory` and `viewHistory` arrays — no changes needed there.

---

### 1 – Add `apiDetails` to `UserKeyState` (`src/services/state.ts`)

The per-user session object is missing an `apiDetails` slot. The `/appData` route currently
falls back to the global `state.requestsUsed / requestsMax` counters, which are only
updated by the legacy single-user loop and are always `0` for v2 users.

```diff
 interface UserKeyState {
   sentMessages: unknown[];
   config: Config;
   applicationOn: boolean; // per-user runtime toggle (NOT persisted)
+  apiDetails: { used: number; max: number };
 }
```

---

### 2 – Initialise `apiDetails` and use it in `/appData` (`src/api/index.ts`)

Two edits in the same file:

**a) `ensureSession()` — initialise the new field:**

```diff
     state.userKeys[apiKey] = {
       sentMessages: [],
       config: sessionConfig,
       applicationOn: false,
+      apiDetails: { used: 0, max: 0 },
     };
```

**b) `GET /api/appData` — return per-user details instead of the global counters:**

```diff
-    apiDetails: {
-      used: state.requestsUsed,
-      max: state.requestsMax,
-    },
+    apiDetails: scopedSession.apiDetails ?? { used: state.requestsUsed, max: state.requestsMax },
```

> **Note:** The client already has a fallback — when the server returns `{used:0, max:0}` it
> queries the P&W GraphQL API directly. The server fix is still recommended so the value is
> accurate even when the browser cannot reach `api.politicsandwar.com`.

---

### 3 – Push v2 automation sent-messages into per-user state (`src/services/v2AutomationRunner.ts`)

The automation runner currently discards the return value of `sendMessageWithConfig`, so
`/api/appData` never sees any v2-sent messages. Two additions are needed:

**a) Add imports at the top of the file:**

```diff
+import { Config } from '../interfaces/types';
+import state from '../services/state';
 import superagent from 'superagent';
```

**b) Inside the per-account send loop, capture the result and push it to the session:**

```diff
-    await messagesService.sendMessageWithConfig(configLike, nation).catch(() => undefined);
-    seen.add(nation.nation_id);
+    const msg = await messagesService.sendMessageWithConfig(configLike, nation).catch(() => undefined);
+    if (msg) {
+      // Ensure a per-user session slot exists so /api/appData can return the message.
+      if (!state.userKeys[pwKey]) {
+        state.userKeys[pwKey] = { sentMessages: [], config: new Config(), applicationOn: false, apiDetails: { used: 0, max: 0 } };
+      }
+      state.userKeys[pwKey].sentMessages.push(msg);
+    }
+    seen.add(nation.nation_id);
```

