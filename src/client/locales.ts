/** Copy owned by the Google Remote Desktop page. */

/** Locale namespace this page registers its dictionaries under. */
export const NS = 'googleRemoteDesktop'

/** Chinese copy. */
export const zh = {
  title: 'Google 远程桌面',
  back: '后退',
  forward: '前进',
  reload: '重新加载',
  computers: '我的电脑',
  support: '远程支持',
  'load.failed': '页面加载失败；请重新加载。',
  'load.signin': '若持续失败，请先登录 AryaAI：持久登录需要账户。',
  'load.hint': '正在载入 Google 远程桌面…',
} satisfies Record<string, string>

/** English copy, same keys. */
export const en = {
  title: 'Google Remote Desktop',
  back: 'Back',
  forward: 'Forward',
  reload: 'Reload',
  computers: 'My computers',
  support: 'Remote support',
  'load.failed': 'The page could not load; reload and try again.',
  'load.signin': 'If this persists, sign in to AryaAI: a persistent guest needs an account.',
  'load.hint': 'Loading Google Remote Desktop…',
} satisfies Record<keyof typeof zh, string>
