import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Env } from '../../types/env'
import { getAuth } from '@hono/oidc-auth'

const app = new Hono<Env>()

// CORS設定
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://your-domain.pages.dev'], // 本番ドメインに変更
  allowMethods: ['POST'],
  allowHeaders: ['Content-Type'],
}))

interface AnalyzeRequest {
  image: string // Base64エンコードされた画像
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
  error?: {
    message: string
  }
}

app.post('/', async (c) => {
  try {
    const apiKey = c.env.GEMINI_API_KEY
    const allowUsers: string[] = c.env.ALLOW_USERS.split(',').map(user => user.trim())
    const auth = await getAuth(c)
    
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'API key not configured' 
      }, 500)
    }

    const { image }: AnalyzeRequest = await c.req.json()
    
    if (!image) {
      return c.json({ 
        success: false, 
        error: 'No image provided' 
      }, 400)
    }

    // 段階的にチェックして型を絞り込む
    if (!auth?.email) {
      return c.json({ 
        success: false, 
        error: 'Email is required.' 
      }, 500)
    }

    if (typeof auth.email !== 'string') {
      return c.json({ 
        success: false, 
        error: 'Invalid email format.' 
      }, 500)
    }

    // この時点で auth.email は string 型として確定
    if (!allowUsers.includes(auth.email)) {
      return c.json({ 
        success: false, 
        error: 'You are Not Allowed User.' 
      }, 500)
    }

    // Gemini API呼び出し
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `この画像は数独（ナンプレ）の問題です。9x9のグリッドから数字を読み取って、JSON形式で返してください。
                
空白のセルは0として表現してください。
以下の形式で返してください：

{
  "grid": [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ],
  "confidence": 0.95
}

注意事項：
- 必ず9x9の配列にしてください
- 数字は1-9、空白は0
- 読み取れない部分は0にしてください
- confidenceは0-1の範囲で読み取り精度を表してください`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiResponse = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message)
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API')
    }

    const textResponse = data.candidates[0].content.parts[0].text
    
    // JSONレスポンスを解析
    let parsedResult
    try {
      // ```json ``` で囲まれている場合の処理
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       textResponse.match(/```\s*([\s\S]*?)\s*```/)
      
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1])
      } else {
        parsedResult = JSON.parse(textResponse)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse)
      throw new Error('Invalid response format from AI')
    }

    // レスポンスの検証
    if (!parsedResult.grid || !Array.isArray(parsedResult.grid)) {
      throw new Error('Invalid grid format in response')
    }

    if (parsedResult.grid.length !== 9) {
      throw new Error('Grid must be 9x9')
    }

    for (const row of parsedResult.grid) {
      if (!Array.isArray(row) || row.length !== 9) {
        throw new Error('Each row must contain exactly 9 elements')
      }
      
      for (const cell of row) {
        if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
          throw new Error('Grid values must be integers between 0-9')
        }
      }
    }

    return c.json({
      success: true,
      grid: parsedResult.grid,
      confidence: parsedResult.confidence || 0.8,
      originalResponse: textResponse // デバッグ用
    })

  } catch (error) {
    console.error('Image analysis error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return c.json({ 
      success: false, 
      error: errorMessage 
    }, 500)
  }
})

export default app
