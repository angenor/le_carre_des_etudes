import type { SessionConfig } from 'h3'

export const sessionConfig: SessionConfig = {
  password: process.env.NUXT_SESSION_SECRET || 'dev-secret-at-least-32-characters-long!',
  cookie: {
    secure: process.env.NUXT_SESSION_SECURE !== 'false' && process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}
