import { env, isProd } from '../config/env'

/**
 * Render free tier spins the instance down after ~15 min of no inbound
 * traffic. The process can't wake itself via localhost (Render measures
 * traffic at the load balancer), but pinging its own public URL leaves and
 * re-enters through the load balancer, which counts as inbound and resets the
 * idle timer. Self-sustaining and free, but best-effort: if the process ever
 * goes fully down, nothing external brings it back until a real request.
 */
export function startKeepWarm() {
  if (!isProd || !env.RENDER_EXTERNAL_URL) return

  const target = `${env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/healthz`

  const ping = async () => {
    try {
      const res = await fetch(target, { headers: { 'user-agent': 'keep-warm' } })
      if (!res.ok) console.error(`[keep-warm] ${target} -> ${res.status}`)
    } catch (err) {
      console.error('[keep-warm] ping failed', err)
    }
  }

  const timer = setInterval(ping, env.KEEP_WARM_INTERVAL_MS)
  timer.unref?.()
  console.log(
    `⏰ keep-warm: pinging ${target} every ${env.KEEP_WARM_INTERVAL_MS}ms`,
  )
}
