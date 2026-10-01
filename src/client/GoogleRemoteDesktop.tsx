/**
 * The page itself: a left-rail icon, the main-panel seat it addresses, and the
 * retained Desktop guest that shows Google Remote Desktop.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  classes, installStyles,
} from './styles.ts'
import type {
  BrowserFrameState, BrowserPage, BrowserPageService, LocalizedProps, PanelIconProps, PanelInfo,
  SnapshotSelectorHook,
} from './types.ts'

// The bundle's module scope runs inside the loader factory, so this is where a
// stylesheet belongs: added on materialization, never at script execution.
installStyles()

/** The global page identity shared by the left rail row and the main-panel seat. */
export const PANEL_ID = 'google-remote-desktop'

/** Google Remote Desktop entry points, in the order the toolbar offers them. */
export const DESTINATIONS = {
  /** The signed-in machine list and the way into a session. */
  computers: 'https://remotedesktop.google.com/access',
  /** Give someone else access to this machine. */
  support: 'https://remotedesktop.google.com/support',
} as const

/** Storage account key: one account-scoped partition for this application page. */
const WORKSPACE_KEY = 'global:google-remote-desktop'

/** Partition namespace; the provider derives the persistent partition from it. */
const STORAGE_NAMESPACE = 'google-remote-desktop'

/** A monitor with a remote-arrow mark: readable at 16-18px in the rail. */
export function GoogleRemoteDesktopIcon({ size }: PanelIconProps): ReactNode {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M8.5 20.5h7" />
      <path d="M12 16.5v4" />
      <path d="M9 8.75h6" />
      <path d="M12.75 6.5 15 8.75l-2.25 2.25" />
    </svg>
  )
}

/** Main-panel seat. The guest is mounted by the overlay, which outlives this occupant. */
export function GoogleRemoteDesktopPanel({ t }: LocalizedProps): ReactNode {
  return <main aria-label={t('title')} className={classes.page} />
}

/** Props the shell hands to an overlay occupant. */
type OverlayProps = LocalizedProps & {
  readonly browserPages: BrowserPageService
  readonly usePanelInfo: SnapshotSelectorHook<PanelInfo>
}

/**
 * Keep one Google Remote Desktop guest connected while Sessions and main panels
 * change. The guest is created the first time this panel is opened and is then
 * retained, so switching away and back does not reload the remote session.
 */
export function GoogleRemoteDesktopOverlay({ browserPages, t, usePanelInfo }: OverlayProps): ReactNode {
  const active = usePanelInfo(info => info.activePanelId === PANEL_ID)
  const viewportId = useId()
  const page = useRef<BrowserPage | null>(null)
  const [frame, setFrame] = useState<BrowserFrameState>(() => browserPages.emptyFrame())
  const [opened, setOpened] = useState(false)

  useEffect(() => { if (active) setOpened(true) }, [active])

  useEffect(() => {
    if (!opened) return undefined
    const created = browserPages.createDesktopPage({
      initial: undefined,
      storage: STORAGE_NAMESPACE,
      persist: () => {},
      openRequested: (url) => {
        // A popup the guest raised (Google sign-in, for instance) opens in this
        // same guest rather than being lost: the provider denies native popups.
        const target = browserPages.parseAddress(url, window.location.origin)
        if (target.ok) created.frame.loadUrl(target.target)
      },
    }, WORKSPACE_KEY)
    page.current = created
    const unmount = created.presentation.mount(viewportId)
    const unsubscribe = created.frame.subscribe(() => { setFrame(created.frame.getSnapshot()) })
    navigate(created, browserPages, DESTINATIONS.computers)
    return () => {
      unsubscribe()
      unmount()
      page.current = null
      void created.frame.dispose()
    }
  }, [browserPages, viewportId, opened])

  const destination = (url: string) => () => {
    const current = page.current
    if (current !== null) navigate(current, browserPages, url)
  }

  return (
    <section className={classes.overlay} data-active={active || undefined} aria-hidden={!active}>
      <header className={classes.toolbar}>
        <button type="button" aria-label={t('back')} disabled={!frame.canGoBack}
          onClick={() => { page.current?.frame.goBack() }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" aria-label={t('forward')} disabled={!frame.canGoForward}
          onClick={() => { page.current?.frame.goForward() }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button type="button" aria-label={t('reload')} disabled={frame.target === undefined}
          onClick={() => { page.current?.frame.reload() }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 5v6h-6" />
          </svg>
        </button>
        <span className={classes.title}>{t('title')}</span>
        {frame.loading && frame.error === undefined && <span className={classes.status}>{t('load.hint')}</span>}
        <span className={classes.separator} />
        <button type="button" className={classes.action} onClick={destination(DESTINATIONS.computers)}>
          {t('computers')}
        </button>
        <button type="button" className={classes.action} onClick={destination(DESTINATIONS.support)}>
          {t('support')}
        </button>
      </header>
      {frame.error !== undefined && <p className={classes.error} role="status">{t('load.failed')}</p>}
      <div id={viewportId} className={classes.viewport} aria-label={t('title')} />
    </section>
  )
}

/** Load a Google Remote Desktop entry point in the existing guest. */
function navigate(page: BrowserPage, browserPages: BrowserPageService, url: string): void {
  const target = browserPages.parseAddress(url, window.location.origin)
  if (target.ok) page.frame.loadUrl(target.target)
}
