import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Env } from '../../types/env'

const app = new Hono<Env>()

// CORS設定
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://your-domain.pages.dev'], // 本番ドメインに変更
  allowMethods: ['POST'],
  allowHeaders: ['Content-Type'],
}))

interface AnalyzeSudokuRequest {
  currentGrid: number[][] // 現在の盤面
  initialGrid: number[][] // 初期盤面
  memoGrid: Array<Array<number[]>> // メモ情報
  progress: number // 進行状況（%）
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
    
    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'API key not configured' 
      }, 500)
    }

    const { currentGrid, initialGrid, memoGrid, progress }: AnalyzeSudokuRequest = await c.req.json()
    
    if (!currentGrid || !initialGrid) {
      return c.json({ 
        success: false, 
        error: 'Invalid request data' 
      }, 400)
    }

    // 盤面をテキスト形式に変換
    const currentGridText = currentGrid.map(row => 
      row.map(cell => cell === 0 ? '.' : cell).join('')
    ).join('\n')

    const initialGridText = initialGrid.map(row => 
      row.map(cell => cell === 0 ? '.' : cell).join('')
    ).join('\n')

    // メモ情報をテキスト形式に変換
    const memoText = memoGrid.map((row, r) => 
      row.map((cell, c) => {
        if (!cell || cell.length === 0) return ''
        return `R${r+1}C${c+1}: ${cell.sort().join(',')}`
      }).filter(text => text !== '')
    ).flat().join('\n')

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
                text: `あなたは数独（ナンプレ）の専門家です。以下の盤面を分析し、次に使えるテクニックを提案してください。

【現在の盤面】
${currentGridText}

【初期盤面】
${initialGridText}

【メモ情報】
${memoText || 'メモはありません'}

【進行状況】
${progress}% 完了

【指示】
1. この盤面で次に使えるテクニックを1つ提案してください
2. そのテクニックの簡単な説明と、この盤面でどこに適用できるかを具体的に示してください
3. 初心者にもわかりやすく説明してください
4. 回答は100-200文字程度で簡潔にまとめてください
5. 回答は日本語でお願いします

以下の形式でJSON形式で返してください：

{
  "technique": "テクニック名",
  "description": "テクニックの説明と適用箇所"
}

例：
{
  "technique": "シングルポジション",
  "description": "R3C5のセルを見てください。このセルには7しか入りません。行、列、ブロックの他のセルを確認すると、7はこのセルにしか配置できないことがわかります。確定数字として7を入力しましょう。"
}
`
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 40
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
    if (!parsedResult.technique || !parsedResult.description) {
      throw new Error('Invalid response format')
    }

    return c.json({
      success: true,
      technique: parsedResult.technique,
      description: parsedResult.description,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Sudoku analysis error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return c.json({ 
      success: false, 
      error: errorMessage 
    }, 500)
  }
})

export default app