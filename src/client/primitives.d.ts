/**
 * The shell-provided icon components this page consumes, declared locally.
 *
 * The browser half is built as a standalone bundle, so it names the shapes it
 * uses instead of importing the DSH type packages: those resolve inside the
 * harness monorepo, not in a checkout of this repository. This mirror is
 * deliberately narrow — only the glyphs the toolbar draws — and mirrors the
 * published `IconProps` so a widened prop shows up here as a type error.
 *
 * Only the type half is missing. The bundle keeps this specifier external (see
 * `tsdown.config.ts` MODULE_TABLE) because the shell's frozen module table
 * answers it at materialization, so there is nothing to install and nothing to
 * inline: the page's own `require` resolves it.
 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  /** Shared props for every product icon component. */
  export interface IconProps {
    /** Square edge in px; defaults to the glyph's own drawn size. */
    readonly size?: number | undefined
    /** Extra class for layout placement; color rides currentColor.
     * (`| undefined` for exactOptionalPropertyTypes: callers forward their own optional prop.) */
    readonly className?: string | undefined
  }

  /** Regular one-pixel chevron pointing left. */
  export const IconChevronLeftOutlineRegular: (props: IconProps) => import('react').ReactNode
  /** Regular one-pixel chevron pointing right. */
  export const IconChevronRightOutlineRegular: (props: IconProps) => import('react').ReactNode
  /** Regular one-pixel refresh arrow. */
  export const IconRefreshOutlineRegular: (props: IconProps) => import('react').ReactNode
}
