import { createApp } from 'honox/server'
import { showRoutes } from 'hono/dev'
import { createHono } from 'honox/factory'
import { oidcAuthMiddleware} from '@hono/oidc-auth'
const baseApp = createHono()
// OIDC認証ミドルウェアを全体に適用
baseApp.use('*', oidcAuthMiddleware())
const app = createApp({app: baseApp})

showRoutes(app)

export default app
