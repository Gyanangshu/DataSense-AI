import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ParserService } from '@/lib/services/parser.service'

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Maximum rows to store in database (for demo purposes)
const MAX_ROWS_TO_STORE = 5000

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }
    
    // Validate file type
    const fileName = file.name.toLowerCase()
    const isCSV = fileName.endsWith('.csv')
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    
    if (!isCSV && !isExcel) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Parse the file
    let parsedData
    try {
      if (isCSV) {
        parsedData = await ParserService.parseCSV(buffer)
      } else {
        parsedData = await ParserService.parseExcel(buffer)
      }
    } catch (parseError) {
      if (parseError instanceof Error) {
        return NextResponse.json(
          { error: `Failed to parse file: ${parseError.message}` },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to parse file' },
        { status: 400 }
      )
    }
    
    // Limit rows for storage (to prevent database overload in demo)
    const dataToStore = parsedData.data.slice(0, MAX_ROWS_TO_STORE)
    const isDataTruncated = parsedData.data.length > MAX_ROWS_TO_STORE
    
    // Create dataset record
    const dataset = await prisma.dataset.create({
      data: {
        name: file.name,
        description: `Uploaded on ${new Date().toLocaleDateString()}${
          isDataTruncated ? ` (showing first ${MAX_ROWS_TO_STORE} of ${parsedData.rowCount} rows)` : ''
        }`,
        sourceType: isCSV ? 'CSV' : 'EXCEL',
        fileName: file.name,
        fileSize: file.size,
        rowCount: parsedData.rowCount,
        columnCount: parsedData.columns.length,
        data: dataToStore,
        columns: parsedData.columns,
        types: parsedData.types,
        stats: parsedData.stats,
        userId: session.user.id,
      },
    })
    
    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
      },
      message: isDataTruncated 
        ? `File uploaded successfully. Showing first ${MAX_ROWS_TO_STORE} of ${parsedData.rowCount} rows.`
        : 'File uploaded and processed successfully!',
      truncated: isDataTruncated,
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload' },
      { status: 500 }
    )
  }
}

// Configure the API route to handle larger payloads
export const runtime = 'nodejs'