export type Env = {
  Bindings:{
    GEMINI_API_KEY: string
    ENVIRONMENT?: string
    ALLOW_USERS: string
  }
}

// Context型も定義
export interface HonoContext {
  Bindings: Env
}
