import { useState } from 'react'
import { PhotoAnalysisResult } from '../utils/sudoku'
import { debugLog, isLocalDevelopment } from '../utils/debug'

interface PhotoUploadProps {
  onPhotoAnalyzed: (result: PhotoAnalysisResult) => void
  onCancel: () => void
}

export default function PhotoUpload({ onPhotoAnalyzed, onCancel }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
      return
    }

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください')
      return
    }
    
    // 画像の解像度チェック
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const minDimension = Math.min(img.width, img.height);
      if (minDimension < 300) {
        setError('画像の解像度が低すぎます。もっと高解像度の画像を使用してください。');
        return;
      }
    };
    img.onerror = () => {
      setError('画像の読み込みに失敗しました');
    };
    img.src = URL.createObjectURL(file);

    setSelectedFile(file)
    setError(null)

    // プレビュー用のURLを作成
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    
    // 画像の前処理を行う
    enhanceImageForOCR(file).then(enhancedFile => {
      if (enhancedFile) {
        setSelectedFile(enhancedFile)
        // プレビューも更新するとユーザーが処理後の画像を確認できる
        const enhancedUrl = URL.createObjectURL(enhancedFile)
        setPreviewUrl(enhancedUrl)
      }
    }).catch(err => {
      console.error('Image enhancement failed:', err)
      // 失敗しても元の画像を使用するのでエラー表示はしない
    })
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // ファイルをBase64に変換
      const base64 = await fileToBase64(selectedFile)
      
      // Gemini AIに送信（後で実装）
      const result = await analyzeImageWithGemini(base64)
      
      onPhotoAnalyzed(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '画像の解析に失敗しました'
      setError(errorMessage)
      console.error('Analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // data:image/jpeg;base64, の部分を除去
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 仮の関数（後でGemini AI APIを実装）
  const analyzeImageWithGemini = async (base64: string): Promise<PhotoAnalysisResult> => {
    try {
      debugLog('Sending image to Gemini API', { imageSize: base64.length })
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64
        })
      })
      debugLog('Gemini API response status', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      debugLog('Gemini API response data', data)

      if (!data.success) {
        throw new Error(data.error || 'API request failed')
      }

      return {
        success: true,
        grid: data.grid,
        confidence: data.confidence,
        originalImage: `data:image/jpeg;base64,${base64}`
      }

    } catch (error) {
      console.error('Gemini API error:', error)
      
      // フォールバック: 開発中はダミーデータを返す
      if (isLocalDevelopment()) {
        debugLog('Using fallback dummy data for development')
        return {
          success: true,
          grid: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
          ],
          confidence: 0.85,
          originalImage: `data:image/jpeg;base64,${base64}`
        }
      }
      
      throw error
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          📷 写真からナンプレを作成
        </h2>

        {/* ファイル選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ナンプレの写真を選択してください
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isAnalyzing}
          />
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG形式、5MB以下、高解像度の画像を推奨
          </p>
        </div>

        {/* プレビュー */}
        {previewUrl && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={previewUrl}
                alt="Selected image"
                className="max-w-full max-h-64 mx-auto rounded"
              />
              <div className="mt-2 text-xs text-gray-500">
                画像は自動的に処理され、数字認識精度が向上します
              </div>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={onCancel}
            disabled={isAnalyzing}
          >
            キャンセル
          </button>
          <button
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                解析中...
              </>
            ) : (
              <>
                🔍 解析開始
              </>
            )}
          </button>
        </div>

        {/* 使用方法のヒント */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📝 撮影のコツ</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ナンプレ全体が写るように撮影してください</li>
            <li>• 明るい場所で、影が入らないように注意してください</li>
            <li>• 数字がはっきり見えるように、ピントを合わせてください</li>
            <li>• 斜めではなく、正面から撮影してください</li>
            <li>• 手書きの数字は、なるべく大きくはっきり書くと認識率が上がります</li>
            <li>• 印刷された数独の方が認識精度が高くなります</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// 画像をOCR用に前処理する関数
const enhanceImageForOCR = async (file: File): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          // キャンバスを作成
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('Canvas context not available');
            resolve(null);
            return;
          }
          
          // 適切なサイズに調整（大きすぎる画像は縮小、小さすぎる画像は拡大）
          const MAX_SIZE = 1200;
          const MIN_SIZE = 600;
          let width = img.width;
          let height = img.height;
          
          if (Math.max(width, height) > MAX_SIZE) {
            const ratio = MAX_SIZE / Math.max(width, height);
            width *= ratio;
            height *= ratio;
          } else if (Math.max(width, height) < MIN_SIZE) {
            const ratio = MIN_SIZE / Math.max(width, height);
            width *= ratio;
            height *= ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 画像を描画
          ctx.drawImage(img, 0, 0, width, height);
          
          // コントラスト強調とノイズ除去
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // グレースケール変換とコントラスト強調
          for (let i = 0; i < data.length; i += 4) {
            // グレースケール変換
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // コントラスト強調（閾値を使用）
            const threshold = 128;
            const newValue = gray > threshold ? 255 : 0;
            
            data[i] = newValue;     // R
            data[i + 1] = newValue; // G
            data[i + 2] = newValue; // B
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // キャンバスからBlobを作成
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error('Failed to create blob from canvas');
              resolve(null);
              return;
            }
            
            // 新しいFileオブジェクトを作成
            const enhancedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(enhancedFile);
          }, 'image/jpeg', 0.95);
          
        } catch (err) {
          console.error('Error processing image:', err);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image');
        resolve(null);
      };
      
      img.src = URL.createObjectURL(file);
      
    } catch (err) {
      console.error('Error in enhanceImageForOCR:', err);
      reject(err);
    }
  });
};