/**
 * Page styles, injected once per document.
 *
 * The bundle is built standalone, so it carries its own stylesheet instead of
 * going through the monorepo's CSS-modules pipeline: {@link installStyles} adds
 * one `data-plugin-css` tag the way the harness preset does for every other
 * client plugin, which keeps this page's styles owned, inspectable and
 * removable on the same terms. Every value comes from the shell's theme tokens,
 * so the page follows the active theme and needs no light/dark pair.
 */

/** Class names used by the page. */
export const classes = {
  page: 'grd-page',
  overlay: 'grd-overlay',
  toolbar: 'grd-toolbar',
  action: 'grd-action',
  separator: 'grd-separator',
  title: 'grd-title',
  status: 'grd-status',
  viewport: 'grd-viewport',
  error: 'grd-error',
} as const

/** Stable style-tag identity for this package, also used to detect a second install. */
const STYLE_TAG_ID = '@deepseek-ai/dsh-client-ui-googleremotedesktop/page.css'

/**
 * The overlay borrows the shell's own main-column bounds
 * (`--dsh-main-left` / `--dsh-main-right`) so the guest covers exactly the area
 * the Conversation would occupy, and stays put while panels and Sessions change.
 */
const css = `
.${classes.page}{flex:1;min-height:0;background:var(--dsw-alias-bg-base)}
.${classes.overlay}{position:absolute;top:0;bottom:0;left:var(--dsh-main-left);right:var(--dsh-main-right);z-index:1;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-base);visibility:hidden;pointer-events:none}
.${classes.overlay}[data-active]{visibility:visible;pointer-events:auto}
.${classes.toolbar}{height:42px;flex:none;display:flex;align-items:center;gap:6px;padding:0 12px;border-bottom:1px solid var(--dsw-alias-border-l3)}
.${classes.toolbar} button{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
.${classes.toolbar} button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.${classes.toolbar} button:disabled{opacity:.4;cursor:default}
.${classes.toolbar} button.${classes.action}{width:auto;padding:0 10px;font:inherit;font-size:12px;white-space:nowrap}
.${classes.title}{margin-left:8px;color:var(--dsw-alias-label-primary);font-weight:600}
.${classes.separator}{flex:1}
.${classes.status}{color:var(--dsw-alias-label-secondary);font-size:12px}
.${classes.viewport}{flex:1;min-height:0}
.${classes.error}{margin:0;padding:8px 12px;color:var(--dsw-alias-state-error-primary)}
`

/**
 * Add this page's stylesheet to the document, once.
 * Called at bundle materialization: every module-scope side effect of a client
 * bundle runs when its factory is first materialized, not at script execution.
 */
export function installStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`) !== null) return
  const tag = document.createElement('style')
  tag.dataset.plugin = '@deepseek-ai/dsh-client-ui-googleremotedesktop'
  tag.dataset.pluginCss = STYLE_TAG_ID
  tag.textContent = css
  document.head.appendChild(tag)
}
