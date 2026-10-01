/**
 * Shared build preset for this plugin.
 *
 * The harness monorepo owns a `clientBundle` preset, but a checkout of this
 * repository is not inside it, so the two artifact contracts it produces are
 * restated here:
 *
 *  - the node half is plain ESM at `lib/index.js`;
 *  - the browser half is a closure-factory artifact at `lib/client.js` — one
 *    CJS bundle whose banner registers `{ id, factory }` with the page's
 *    `window.__ModuleLoader__` and whose body is the factory. Everything the
 *    shell's frozen module table answers (`react`, `react/jsx-runtime`, the
 *    platform packages) stays an external `require(...)`; everything else is
 *    inlined, because a `require` the table cannot answer throws at
 *    materialization.
 */
import type { UserConfig } from 'tsdown'

/** Plugin id (package name): the module-table registration key and bundle identity. */
const ID = '@deepseek-ai/dsh-client-ui-googleremotedesktop'

/** Specifiers the shell seeds into the module table, from its own platform roster. */
const MODULE_TABLE = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

/** The node half: what the host Loader imports. */
const host: UserConfig = {
  name: `${ID}/host`,
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: true,
  clean: false,
  fixedExtension: false,
}

/** The browser half: the closure-factory bundle the page loads. */
const client: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: ['cjs'],
  platform: 'browser',
  target: 'es2024',
  dts: false,
  clean: false,
  sourcemap: true,
  deps: {
    neverBundle: MODULE_TABLE,
    alwaysBundle: (specifier: string) => !MODULE_TABLE.includes(specifier),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
}

export default [host, client]
