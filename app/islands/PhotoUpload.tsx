import { useState, useEffect, useRef } from 'react'
import { PhotoAnalysisResult } from '../utils/sudoku'
import { debugLog, isLocalDevelopment } from '../utils/debug'

interface PhotoUploadProps {
  onPhotoAnalyzed: (result: PhotoAnalysisResult) => void
  onCancel: () => void
}

// サーバーサイドレンダリング時にはシンプルなプレースホルダーを返す関数
function ServerSidePlaceholder() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 flex justify-center items-center" style={{ minHeight: '300px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    </div>
  );
}

// クライアントサイドでのみ実行されるコンポーネント
function ClientSidePhotoUpload({ onPhotoAnalyzed, onCancel }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState<number>(128) // コントラストのしきい値
  const [contrastEnabled, setContrastEnabled] = useState<boolean>(true) // コントラスト強調の有効/無効
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)

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
      
      // 元の画像を保存
      setOriginalFile(file);
      
      // キャンバスに画像を描画して元のImageDataを保存
      loadImageToCanvas(file);
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

  // 画像をキャンバスに読み込む関数
  const loadImageToCanvas = (file: File) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // 適切なサイズに調整
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
        
        // 元の画像データを保存
        const imageData = ctx.getImageData(0, 0, width, height);
        setOriginalImageData(imageData);
        
        // 初期処理を適用
        const currentThreshold = threshold || 128; // デフォルト値を使用
        applyImageProcessing(imageData, currentThreshold, contrastEnabled);
      } catch (err) {
        console.error('Error loading image to canvas:', err);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
    };
    
    img.src = URL.createObjectURL(file);
  };
  
  // 画像処理を適用する関数
  const applyImageProcessing = (imageData: ImageData, thresholdValue: number, applyContrast: boolean) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    try {
      // 元のデータをコピー
      const newImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      
      const data = newImageData.data;
      
      if (applyContrast) {
        // コントラスト強調を適用する場合
        for (let i = 0; i < data.length; i += 4) {
          // グレースケール変換
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // コントラスト強調（閾値を使用）
          const newValue = gray > thresholdValue ? 255 : 0;
          
          data[i] = newValue;     // R
          data[i + 1] = newValue; // G
          data[i + 2] = newValue; // B
        }
      } else {
        // コントラスト強調を適用しない場合は、グレースケール化のみ行う
        for (let i = 0; i < data.length; i += 4) {
          // グレースケール変換
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          data[i] = gray;     // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
        }
      }
      
      ctx.putImageData(newImageData, 0, 0);
      
      // 処理後の画像をプレビューとして設定
      updatePreviewFromCanvas();
    } catch (err) {
      console.error('Error applying image processing:', err);
    }
  };
  
  // キャンバスから画像を取得してプレビューを更新
  const updatePreviewFromCanvas = () => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(dataUrl);
      
      // Fileオブジェクトも更新
      canvasRef.current.toBlob((blob) => {
        if (!blob || !originalFile) return;
        
        const enhancedFile = new File([blob], originalFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        setSelectedFile(enhancedFile);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Error updating preview from canvas:', err);
    }
  };
  
  // 画像処理設定が変更されたときの処理
  useEffect(() => {
    if (originalImageData && typeof threshold === 'number') {
      applyImageProcessing(originalImageData, threshold, contrastEnabled);
    }
  }, [threshold, contrastEnabled, originalImageData]);

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
              
              {/* 詳細設定ボタン */}
              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  画像は自動的に処理され、数字認識精度が向上します
                </div>
                <button 
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showAdvancedSettings ? '詳細設定を隠す' : '詳細設定を表示'}
                </button>
              </div>
              
              {/* 詳細設定パネル */}
              {showAdvancedSettings && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                  {/* コントラスト強調の有効/無効切り替え */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        コントラスト強調
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input 
                          type="checkbox" 
                          id="toggle-contrast" 
                          checked={contrastEnabled}
                          onChange={() => setContrastEnabled(!contrastEnabled)}
                          className="sr-only"
                        />
                        <label 
                          htmlFor="toggle-contrast"
                          className={`block overflow-hidden h-6 rounded-full cursor-pointer ${contrastEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                          <span 
                            className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${contrastEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                          ></span>
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      コントラスト強調をオフにすると、元の画像に近い状態で処理されます。
                      印刷された数独や高品質な画像では、オフにした方が良い結果が得られる場合があります。
                    </p>
                  </div>
                  
                  {/* コントラスト強調が有効な場合のみしきい値設定を表示 */}
                  {contrastEnabled && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        コントラストしきい値: {threshold}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>暗い (0)</span>
                        <span>中間 (128)</span>
                        <span>明るい (255)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        しきい値を調整して、数字の認識精度を向上させることができます。
                        数字が見えにくい場合は値を下げ、ノイズが多い場合は値を上げてみてください。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 非表示のキャンバス（画像処理用） */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
        />

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
            <li>• 認識精度が低い場合は、詳細設定でコントラスト設定を調整してみてください</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// アイランドコンポーネントのエクスポート
export default function PhotoUpload(props: PhotoUploadProps) {
  // サーバーサイドレンダリング時
  if (typeof window === 'undefined') {
    return <ServerSidePlaceholder />;
  }
  
  // クライアントサイドレンダリング時
  return <ClientSidePhotoUpload {...props} />;
}