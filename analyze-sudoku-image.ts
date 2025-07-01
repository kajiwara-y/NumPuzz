#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// APIキーを環境変数から取得
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  console.error('Please set it in a .env file or as an environment variable');
  process.exit(1);
}

// コマンドライン引数からファイルパスを取得
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Error: No image file specified');
  console.error('Usage: node analyze-sudoku-image.js <path-to-image-file>');
  process.exit(1);
}

// ファイルの存在確認
if (!fs.existsSync(imagePath)) {
  console.error(`Error: File not found: ${imagePath}`);
  process.exit(1);
}

// 画像ファイルの拡張子チェック
const ext = path.extname(imagePath).toLowerCase();
if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
  console.error('Error: Only JPG and PNG images are supported');
  process.exit(1);
}

interface AnalysisResult {
  success: boolean;
  grid?: number[][];
  confidence?: number;
  error?: string;
}

interface GeminiResponse {
  grid: number[][];
  confidence: number;
}

/**
 * 画像ファイルを解析して数独グリッドを抽出する
 * @param imagePath - 画像ファイルのパス
 * @returns 解析結果
 */
async function analyzeSudokuImage(imagePath: string): Promise<AnalysisResult> {
  try {
    // 画像ファイルをバイナリデータとして読み込む
    const imageData = fs.readFileSync(imagePath);
    
    // Gen AI SDKを初期化
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

    console.log('Analyzing image...');
    
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
                mimeType: getMimeType(ext),
                data: imageData.toString('base64')
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
      throw new Error('No response from Gemini API');
    }

    // JSONレスポンスを解析
    let parsedResult: GeminiResponse;
    try {
      // ```json ``` で囲まれている場合の処理
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       textResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1]);
      } else {
        parsedResult = JSON.parse(textResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textResponse);
      throw new Error('Invalid response format from AI');
    }

    // レスポンスの検証
    if (!parsedResult.grid || !Array.isArray(parsedResult.grid)) {
      throw new Error('Invalid grid format in response');
    }

    if (parsedResult.grid.length !== 9) {
      throw new Error('Grid must be 9x9');
    }

    for (const row of parsedResult.grid) {
      if (!Array.isArray(row) || row.length !== 9) {
        throw new Error('Each row must contain exactly 9 elements');
      }
      
      for (const cell of row) {
        if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
          throw new Error('Grid values must be integers between 0-9');
        }
      }
    }

    return {
      success: true,
      grid: parsedResult.grid,
      confidence: parsedResult.confidence || 0.8
    };

  } catch (error) {
    console.error('Image analysis error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * ファイル拡張子からMIMEタイプを取得
 * @param ext - ファイル拡張子
 * @returns MIMEタイプ
 */
function getMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

/**
 * 数独グリッドを整形して表示
 * @param grid - 数独グリッド
 */
function printSudokuGrid(grid: number[][]): void {
  console.log('┌───────┬───────┬───────┐');
  
  for (let i = 0; i < 9; i++) {
    let row = '│ ';
    
    for (let j = 0; j < 9; j++) {
      const value = grid[i][j] === 0 ? ' ' : grid[i][j].toString();
      row += value + ' ';
      
      if (j === 2 || j === 5) {
        row += '│ ';
      }
    }
    
    row += '│';
    console.log(row);
    
    if (i === 2 || i === 5) {
      console.log('├───────┼───────┼───────┤');
    }
  }
  
  console.log('└───────┴───────┴───────┘');
}

// メイン処理
(async (): Promise<void> => {
  console.log(`Analyzing sudoku image: ${imagePath}`);
  
  const result = await analyzeSudokuImage(imagePath);
  
  if (result.success && result.grid) {
    console.log('\nAnalysis successful!');
    console.log(`Confidence: ${((result.confidence || 0.8) * 100).toFixed(1)}%\n`);
    
    // 数独グリッドを表示
    printSudokuGrid(result.grid);
    
    // 結果をJSONとして保存
    const outputPath = path.join(
      path.dirname(imagePath),
      `${path.basename(imagePath, path.extname(imagePath))}_result.json`
    );
    
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\nResult saved to: ${outputPath}`);
  } else {
    console.error('\nAnalysis failed:', result.error);
    process.exit(1);
  }
})();