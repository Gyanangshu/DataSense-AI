'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/utils'

interface UploadResponse {
  success: boolean
  dataset?: {
    id: string
    name: string
    rowCount: number
    columnCount: number
  }
  message: string
  truncated?: boolean
  error?: string
}

export default function FileUploader() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setError('')
    setSuccess('')
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      validateAndSetFile(files[0])
    }
  }, [])
  
  const validateAndSetFile = (file: File) => {
    setError('')
    setSuccess('')
    
    // Validate file type
    const validExtensions = ['.csv', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const isValid = validExtensions.some(ext => fileName.endsWith(ext))
    
    if (!isValid) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }
    
    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }
    
    setFile(file)
  }
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      validateAndSetFile(files[0])
    }
  }
  
  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setError('')
    setSuccess('')
    setUploadProgress(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const data: UploadResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      if (data.success && data.dataset) {
        setSuccess(data.message)
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push(`/dashboard`)
        }, 2000)
      }
      
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setUploading(false)
    }
  }
  
  const removeFile = () => {
    setFile(null)
    setError('')
    setSuccess('')
    setUploadProgress(0)
  }
  
  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12 text-muted-foreground" />
    
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.csv')) {
      return <FileText className="w-12 h-12 text-foreground" />
    }
    return <FileSpreadsheet className="w-12 h-12 text-foreground" />
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 ease-in-out
          ${dragActive 
            ? 'border-primary bg-accent scale-[1.02]' 
            : file 
              ? success
                ? 'border-success bg-accent'
                : 'border-border bg-accent'
              : 'border-border hover:border-muted-foreground'
          }
          ${uploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && document.getElementById('file-upload')?.click()}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          disabled={uploading}
        />
        
        <div className="text-center">
          {!file ? (
            <>
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-1">
                Drop your file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports CSV and Excel files (max 10MB)
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                {getFileIcon()}
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                {!uploading && !success && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile()
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              {/* Upload Progress */}
              {uploading && uploadProgress > 0 && (
                <div className="px-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Success State */}
              {success && (
                <div className="flex items-center justify-center space-x-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Upload successful!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Success!</p>
            <p className="text-sm text-success/80 mt-1">{success}</p>
            <p className="text-xs text-success/70 mt-2">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
      
      {/* Upload Button */}
      {file && !uploading && !success && (
        <Button
          onClick={handleUpload}
          className="w-full"
          size="lg"
        >
          <BarChart3 className="mr-2 h-5 w-5" />
          Upload and Analyze
        </Button>
      )}
      
      {/* Info Section */}
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-3">
          📊 What happens after upload?
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Automatic data type detection for each column</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Statistics calculation (mean, median, min, max, etc.)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Data quality analysis (null values, unique counts)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Ready for visualization and AI analysis</span>
          </li>
        </ul>
      </div>
    </div>
  )
}