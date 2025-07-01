import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Env } from '../../types/env'
import { getAuth } from '@hono/oidc-auth'
// Google AI パッケージは動的インポートで読み込み

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

    // Gen AI SDKを動的インポートで読み込み
    const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey });

    const prompt = `この画像は数独（ナンプレ）の問題です。9x9のグリッドから数字を読み取って、JSON形式で返してください。

画像処理手順:
1. 必ず左上から右下へ、行ごとに順番に読み取ってください
2. 各行は必ず9つのセルで構成されています
3. 数字が書かれていないセルは0として記録してください
4. 数字の位置を間違えないよう、グリッドの線を基準に正確に判定してください

読み取り手順:
- 1行目: 左端から右端まで9つのセルを順番に確認
- 2行目: 左端から右端まで9つのセルを順番に確認
- ...9行目まで繰り返し

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

重要な注意事項:
- 必ず9x9の配列を返してください
- 数字は1-9、空白は0と表現してください
- 読み取れない部分は0にしてください
- 数字の認識に自信がない場合は0にしてください
- 画像の傾きや歪みを補正して読み取ってください
- 数字の形状をよく観察し、1と7、4と9などの混同に注意してください
- confidenceは0-1の範囲で読み取り精度を表してください

画像を慎重に分析し、グリッドの境界線を基準に正確に数字の位置を特定してください。`;

    // リクエストを送信
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image // Base64エンコードされた文字列をそのまま使用
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 1000,
        topP: 0.1,
        topK: 10
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ]
    });

    const textResponse = result.text;

    if (!textResponse) {
      throw new Error('No response from Gemini API')
    }

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
