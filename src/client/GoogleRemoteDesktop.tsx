/**
 * The page itself: a left-rail icon, the main-panel seat it addresses, and the
 * retained Desktop guest that shows Google Remote Desktop.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { IconChevronLeftOutlineRegular, IconChevronRightOutlineRegular,
  IconRefreshOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  classes, installStyles,
} from './styles.ts'
import type {
  BrowserFrameState, BrowserPage, BrowserPageService, BrowserTarget, LocalizedProps, PanelIconProps,
  PanelInfo, SnapshotSelectorHook,
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

/**
 * How long a reload request may go unanswered before the guest is replaced.
 * A carrier that accepts the request publishes loading state in the same turn,
 * so this only ever elapses when the request was refused outright.
 */
const RELOAD_REFUSAL_MS = 300

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
  /** Bumped to retire a guest the carrier would not reload and stand up its replacement. */
  const [generation, setGeneration] = useState(0)
  /** Address a replacement guest must come back to; the first guest opens the entry point. */
  const resume = useRef<BrowserTarget | undefined>(undefined)
  const refusal = useRef<number | undefined>(undefined)

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
        const target = resolve(browserPages, url)
        if (target !== undefined) created.frame.loadUrl(target)
      },
    }, WORKSPACE_KEY)
    page.current = created
    const unmount = created.presentation.mount(viewportId)
    const unsubscribe = created.frame.subscribe(() => { setFrame(created.frame.getSnapshot()) })
    const destination = resume.current ?? resolve(browserPages, DESTINATIONS.computers)
    resume.current = undefined
    if (destination !== undefined) created.frame.loadUrl(destination)
    return () => {
      unsubscribe()
      unmount()
      page.current = null
      void created.frame.dispose()
    }
  }, [browserPages, viewportId, opened, generation])

  useEffect(() => () => { window.clearTimeout(refusal.current) }, [])

  /**
   * Reload the page on screen.
   *
   * The Desktop carrier answers a same-address reload with `<webview>.reload()`,
   * but returns silently — publishing no state at all — when it cannot act: no
   * address, no guest element, or an aborted lifetime. A click that publishes
   * nothing is indistinguishable from a broken button, so a snapshot that has
   * not moved by the next turn is read as a refusal and answered by retiring the
   * guest and standing up its replacement, which navigates for real. With no
   * address on screen there is nothing to reload, so the entry point is opened
   * again rather than doing nothing.
   */
  const reload = (): void => {
    const created = page.current
    if (created === null) return
    const before = created.frame.getSnapshot()
    if (before.target === undefined) {
      navigate(created, browserPages, DESTINATIONS.computers)
      return
    }
    created.frame.reload()
    window.clearTimeout(refusal.current)
    refusal.current = window.setTimeout(() => {
      if (page.current?.frame.getSnapshot() !== before) return
      resume.current = before.target
      setGeneration(current => current + 1)
    }, RELOAD_REFUSAL_MS)
  }

  const destination = (url: string) => () => {
    const current = page.current
    if (current !== null) navigate(current, browserPages, url)
  }

  return (
    <section className={classes.overlay} data-active={active || undefined} aria-hidden={!active}>
      <header className={classes.toolbar}>
        <button type="button" aria-label={t('back')} disabled={!frame.canGoBack}
          onClick={() => { page.current?.frame.goBack() }}>
          <IconChevronLeftOutlineRegular />
        </button>
        <button type="button" aria-label={t('forward')} disabled={!frame.canGoForward}
          onClick={() => { page.current?.frame.goForward() }}>
          <IconChevronRightOutlineRegular />
        </button>
        {/* Never disabled: with no address on screen the control re-enters the page. */}
        <button type="button" aria-label={t('reload')} onClick={reload}>
          <IconRefreshOutlineRegular />
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
      {frame.error !== undefined && (
        <p className={classes.error} role="status">
          {t('load.failed')} <span className={classes.status}>{t('load.signin')}</span>
        </p>
      )}
      <div id={viewportId} className={classes.viewport} aria-label={t('title')} />
    </section>
  )
}

/** Validate one address with the provider's fixed policy. */
function resolve(browserPages: BrowserPageService, url: string): BrowserTarget | undefined {
  const parsed = browserPages.parseAddress(url, window.location.origin)
  return parsed.ok ? parsed.target : undefined
}

/** Load a Google Remote Desktop entry point in the existing guest. */
function navigate(page: BrowserPage, browserPages: BrowserPageService, url: string): void {
  const target = resolve(browserPages, url)
  if (target !== undefined) page.frame.loadUrl(target)
}
