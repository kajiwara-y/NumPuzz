import { Hono } from 'hono'
import { env, getRuntimeKey } from 'hono/adapter'
import type { Env } from '../../types/env'

const app = new Hono<Env>()

app.get('/', async (c) => {
  // 本番環境では無効化
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'Not available in production' }, 403)
  }
  const { GEMINI_API_KEY } = env<{ GEMINI_API_KEY: string }>(c)
  const { ENVIRONMENT } = env<{ ENVIRONMENT: string }>(c)

  return c.json({
    hasGeminiKey: !!c.env.GEMINI_API_KEY,
    keyLength: c.env.GEMINI_API_KEY?.length || 0,
  })
})

export default app
