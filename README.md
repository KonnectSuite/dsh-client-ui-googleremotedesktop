---
description: "Google Remote Desktop in the AryaAI sidebar, on a persistent plugin-owned guest."
kind: "package-reference"
---

# dsh-client-ui-googleremotedesktop

Google Remote Desktop, one click from the left sidebar — with a sign-in that
survives an application restart.

## What it adds

| Seat | What it contributes |
| --- | --- |
| `sidebar.panellist` | The monitor icon in the left rail (order `-8`). The sidebar owns the button and reads its label from the registration. |
| `main` (key `google-remote-desktop`) | The main-column seat the icon addresses. |
| `shell.overlay` | The retained Desktop guest that actually shows Google Remote Desktop. |

Opening the panel loads `https://remotedesktop.google.com/access`; the toolbar
carries Back, Forward, Reload and two shortcuts — **My computers**
(`/access`) and **Remote support** (`/support`). The guest is created the first
time the panel is opened and is then kept connected, so switching panels or
Sessions does not reload a live remote session.

## Why it is not an iframe

Google Remote Desktop answers `X-Frame-Options: SAMEORIGIN` (measured on
`/access`, `/support` and `/`), so no iframe can ever display it — this rules
out both a frame-based panel and the shipped Browser tab's Web carrier for this
site.

The page therefore uses `browserPages`, the Desktop guest provider published by
`@deepseek-ai/dsh-client-ui-sidebar-browser` for optional page plugins. A
provider-owned Electron `<webview>` is a real top-level navigation, so
`X-Frame-Options` does not apply, and the provider keeps ownership of the guest
lease, the HTTP(S) navigation policy and partition isolation.

## Persistence

`createDesktopPage({ storage: 'google-remote-desktop' }, 'global:google-remote-desktop')`
asks for an **account-scoped persistent partition** rather than the temporary
one a workspace Browser tab uses. Google's sign-in cookies therefore survive an
application restart, which is the one thing the generic Browser tab cannot do.

Two consequences worth knowing:

- **Sign in to AryaAI first.** The main process refuses a persistent guest when
  no account is signed in (`sign in before opening persistent browser storage`),
  and the panel then shows its load-failure notice. A temporary workspace tab
  has no such requirement.
- The partition is keyed by the signed-in account, so signing out (or switching
  accounts) retires this guest and its storage; Google sign-in starts over.

Guest permissions, downloads and native popups are denied by the provider.
Google's sign-in is a same-page redirect flow, which works; a popup the guest
does raise is re-loaded inside the same guest through `openRequested` instead of
being dropped. Screen sharing (Google's own "share my screen" support mode)
needs a capability this guest withholds — remote-controlling *another* machine
does not, because the remote host does the capturing.

## Development

```sh
pnpm install
pnpm run build      # lib/index.js (node half) + lib/client.js (browser half)
pnpm run typecheck
pnpm run watch      # rebuild the client bundle while editing
```

`tsdown.config.ts` restates the two artifact contracts the harness monorepo
produces with its `clientBundle` preset, so this package builds standalone:

- `lib/index.js` — plain ESM for the host Loader;
- `lib/client.js` — a closure-factory bundle that registers
  `{ id, factory }` with the page's `window.__ModuleLoader__`. Only specifiers
  the shell's frozen module table answers (`react`, `react/jsx-runtime`) stay
  external; everything else is inlined, because a `require` the table cannot
  answer throws at materialization.

## Install into a profile

The package is a bundle (`dsh.bundle.patch` → `cordis.patch.yml`), so a profile
selects it by name and links the checkout:

```jsonc
// <profile>/package.json
"dsh": { "profile": { "bundles": [ /* … */ "@deepseek-ai/dsh-client-ui-googleremotedesktop" ] } },
"dependencies": {
  "@deepseek-ai/dsh-client-ui-googleremotedesktop": "link:C:/path/to/dsh-client-ui-googleremotedesktop"
}
```

With HMR enabled in the profile, the new bundle composes into the running
session; the icon appears without restarting the application.
