import { secureHeaders } from 'hono/secure-headers'

export const securityHeaders = secureHeaders({
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  crossOriginEmbedderPolicy: 'require-corp',
  contentSecurityPolicy: { defaultSrc: ["'none'"] },
})
