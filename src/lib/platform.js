const ua = typeof navigator !== 'undefined' ? navigator.userAgentData?.platform || navigator.platform || navigator.userAgent : ''

export const isMac = /mac|iphone|ipad|ipod/i.test(ua)
export const modKey = isMac ? '⌘' : 'Ctrl'
