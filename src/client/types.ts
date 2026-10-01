/**
 * The client surfaces this page consumes, declared locally.
 *
 * The browser half is built as a standalone bundle, so it names the shapes it
 * uses instead of importing the DSH type packages: those resolve inside the
 * harness monorepo, not in a checkout of this repository. Each interface below
 * mirrors one published contract, and the mirror is deliberately narrow — only
 * the members this page touches. A contract drift that matters (a renamed
 * method, a changed argument, a result that stops being discriminated) shows up
 * as a type error here, and as a missing member at runtime.
 */

/** A snapshot selector handed to slot occupants by the renderer. */
export type SnapshotSelectorHook<State> = <Selected>(select: (state: State) => Selected) => Selected

/** Main-panel projection: which global panel is currently on screen. */
export interface PanelInfo {
  /** The selected global panel id, absent before any panel is chosen. */
  readonly activePanelId?: string | undefined
}

/** Cordis locale service, as a page occupant uses it. */
export interface LocaleService {
  /** Bind a namespace to a translation function. */
  bind(namespace: string): (key: string) => string
  /** Register dictionaries for a namespace. @returns disposer. */
  register(
    namespace: string,
    dictionaries: { readonly zh: Record<string, string>, readonly en: Record<string, string> },
  ): () => void
}

/** The seats this page registers into. */
export type SlotName = 'main' | 'sidebar.panellist' | 'shell.overlay'

/** Registration metadata the slot owner reads for one occupant. */
export interface SlotRegistration {
  readonly name: SlotName
  /** List cell key (`sidebar.panellist`, `shell.overlay`). */
  readonly id?: string
  /** Keyed cell key (`main`). */
  readonly key?: string
  /** Position among list occupants, ascending. */
  readonly order?: number
  /** Display text, or a thunk re-read on every projection. */
  readonly label?: string | (() => string)
  /** Locale namespace projected into the occupant as `t`. */
  readonly locale?: string
  /** Extra props handed to the occupant. */
  readonly inject?: () => Record<string, unknown>
}

/** Cordis slot registry, as a page plugin uses it. */
export interface SlotsService {
  /** Run `register` once the named slot exists. */
  inject(name: SlotName, register: () => unknown): void
  /** Occupy a slot. @returns a disposable registration. */
  register(options: SlotRegistration, occupant: unknown): unknown
}

/** A validated HTTP(S) address the guest can load. */
export interface BrowserTarget {
  readonly url: string
  readonly title?: string | undefined
}

/** Address validation result: a discriminated union, so `target` is present exactly when `ok` is. */
export type BrowserAddressResult =
  | { readonly ok: true, readonly target: BrowserTarget }
  | { readonly ok: false }

/** Carrier-neutral navigation state of one guest. */
export interface BrowserFrameState {
  readonly target?: BrowserTarget | undefined
  readonly loading: boolean
  readonly canGoBack: boolean
  readonly canGoForward: boolean
  readonly error?: unknown
}

/** Navigation operations of one guest, independent of DOM placement. */
export interface BrowserFrame {
  getSnapshot(): BrowserFrameState
  subscribe(listener: () => void): () => void
  loadUrl(target: BrowserTarget): void
  goBack(): void
  goForward(): void
  reload(): void
  dispose(): Promise<void>
}

/** Physical DOM attachment owned by the guest. */
export interface BrowserPresentation {
  /** Attach the guest inside the element with this id. @returns detach callback. */
  mount(viewportId: string): () => void
}

/** One navigation provider plus its presentation. */
export interface BrowserPage {
  readonly frame: BrowserFrame
  readonly presentation: BrowserPresentation
}

/** Guest construction inputs. */
export interface BrowserPageOptions {
  /**
   * Account-scoped persistent storage namespace. This is what keeps the Google
   * sign-in across application restarts, unlike a temporary workspace tab.
   */
  readonly storage?: string | undefined
  readonly initial?: BrowserFrameState | undefined
  readonly persist: (state: unknown) => void
  readonly openRequested: (url: string) => void
}

/**
 * The Desktop guest provider offered to optional page plugins. Supplied by
 * `@deepseek-ai/dsh-client-ui-sidebar-browser`, which owns guest leases,
 * navigation policy and partition isolation.
 */
export interface BrowserPageService {
  /**
   * Create an idle guest for this plugin's own page.
   * @param options - storage namespace, persistence and popup handling.
   * @param workspace - storage account key.
   */
  createDesktopPage(options: BrowserPageOptions, workspace: string): BrowserPage
  /** Validate an address with the provider's fixed policy. */
  parseAddress(input: string, applicationOrigin?: string): BrowserAddressResult
  /** The state before the guest navigates. */
  emptyFrame(): BrowserFrameState
}

/** The client context subset this page's `apply` uses. */
export interface ClientScope {
  readonly slots: SlotsService
  readonly locale: LocaleService
  /** The Desktop guest provider; present only after `browserPages` is injected. */
  readonly browserPages: BrowserPageService
  /** Wait for services, then run on a scope that has them. */
  inject(dependencies: readonly string[], apply: (scope: ClientScope) => void): void
  /** Run setup with its cleanup tied to the plugin's own lifetime. */
  effect(callback: () => (() => void) | void, label?: string): void
}

/** Props the sidebar panel row hands to an icon occupant. */
export interface PanelIconProps {
  /** Requested square edge in pixels. */
  readonly size: number
  /** Whether this panel is the selected one. */
  readonly active: boolean
}

/** Props the renderer hands to a localized occupant. */
export interface LocalizedProps {
  /** Translation bound to the registration's locale namespace. */
  readonly t: (key: string) => string
}
