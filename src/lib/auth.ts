import { betterAuth } from 'better-auth'
import { pool } from './db'

const secret = process.env.BETTER_AUTH_SECRET
if (!secret && process.env.NODE_ENV === 'production') throw new Error('BETTER_AUTH_SECRET must be set in production.')

export const auth = betterAuth({
  database: pool,
  secret: secret || 'dev-only-secret-change-me-dev-only-secret',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  // on by default in production (sign-up is open to everyone); the e2e stack creates dozens of users a second
  rateLimit: { enabled: process.env.AUTH_RATE_LIMIT !== 'false' },
  trustedOrigins: (process.env.TRUSTED_ORIGINS || '').split(',').filter(Boolean),
  emailAndPassword: {
    enabled: true,
    // sign-up is open and needs no email verification; the account is usable right away
    requireEmailVerification: false,
    autoSignIn: true,
    minPasswordLength: 6
  }
})
