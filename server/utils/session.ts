import type { SessionConfig } from 'h3'

const secret = process.env.NUXT_SESSION_SECRET

// En production, jamais de repli sur le secret de dev : il est public dans le dépôt
// et permettrait de forger un cookie de session admin. Mieux vaut refuser de démarrer.
if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
  throw new Error('NUXT_SESSION_SECRET manquant ou trop court (32 caractères minimum) : ajoutez-le au .env de production (./deploy.sh setup le génère).')
}

export const sessionConfig: SessionConfig = {
  password: secret || 'dev-secret-at-least-32-characters-long!',
  cookie: {
    secure: process.env.NUXT_SESSION_SECURE !== 'false' && process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}
