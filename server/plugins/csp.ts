import { definePlugin } from 'nitro'

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook('response', (res, event) => {
    const pathname = new URL(event.req.url).pathname
    if (pathname === '/status') {
      res.headers.set('Content-Security-Policy', 'frame-ancestors *')
      res.headers.delete('X-Frame-Options')
    }
  })
})
