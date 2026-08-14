export const SITE_COLLAPSED_WIDTH = 160
export const SITE_COLLAPSED_HEIGHT = 60

export function pointInSite(site, x, y) {
  return x >= site.x && x <= site.x + site.width && y >= site.y && y <= site.y + site.height
}

export function siteDisplaySize(site) {
  return site.collapsed
    ? { width: SITE_COLLAPSED_WIDTH, height: SITE_COLLAPSED_HEIGHT }
    : { width: site.width, height: site.height }
}
