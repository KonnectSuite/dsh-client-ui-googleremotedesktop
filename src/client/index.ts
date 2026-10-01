/**
 * Google Remote Desktop, browser half.
 *
 * Three registrations make the page reachable and usable:
 *  - `sidebar.panellist` puts the icon in the left rail, where the sidebar owns
 *    the button and resolves its label from the registration;
 *  - `main` occupies the main column while the icon is selected (the guest
 *    itself lives in the frame-wide overlay, so it survives panel changes);
 *  - `shell.overlay` hosts the Electron guest, kept connected across Sessions
 *    and panels.
 *
 * The guest is created through `browserPages`, the Desktop provider the sidebar
 * browser package offers to optional page plugins. That is deliberate: Google
 * Remote Desktop answers `X-Frame-Options: SAMEORIGIN`, so no iframe can show
 * it, while a provider-owned webview is a real top-level navigation. The
 * provider also gives the page an account-scoped persistent partition, so the
 * Google sign-in and the machine list survive an application restart — the one
 * thing a temporary workspace browser tab cannot do.
 */
import type { ClientScope } from './types.ts'
import { en, NS, zh } from './locales.ts'
import {
  GoogleRemoteDesktopIcon, GoogleRemoteDesktopOverlay, GoogleRemoteDesktopPanel, PANEL_ID,
} from './GoogleRemoteDesktop.tsx'

/**
 * Services needed before anything is registered: the slot registry and copy.
 * `browserPages` and the layout service are injected inside `apply`, because a
 * profile without the Desktop provider (a Web profile) must leave this page
 * inert rather than fail its fiber.
 */
export const inject = ['slots', 'locale']

/**
 * Register the icon, the main-panel seat and the guest overlay.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientScope): void {
  ctx.inject(['browserPages'], (scope) => {
    const t = scope.locale.bind(NS)
    scope.effect(() => scope.locale.register(NS, { zh, en }), 'ui-googleremotedesktop.copy')
    scope.slots.inject('main', () => scope.slots.register({
      name: 'main', key: PANEL_ID, locale: NS,
    }, GoogleRemoteDesktopPanel))
    scope.slots.inject('sidebar.panellist', () => scope.slots.register({
      name: 'sidebar.panellist', id: PANEL_ID, order: -8, locale: NS, label: () => t('title'),
    }, GoogleRemoteDesktopIcon))
    scope.slots.inject('shell.overlay', () => scope.slots.register({
      name: 'shell.overlay', id: PANEL_ID, locale: NS,
      inject: () => ({ browserPages: scope.browserPages }),
    }, GoogleRemoteDesktopOverlay))
  })
}
