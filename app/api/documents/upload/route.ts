import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/services/ai.service'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 })
    }

    // Extract text based on file type
    let textContent = ''
    const fileType = file.type
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    if (fileType === 'text/plain') {
      // TXT file
      textContent = fileBuffer.toString('utf-8')
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX file
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      textContent = result.value
    } else if (fileType === 'application/pdf') {
      // PDF file
      const parser = new PDFParse({ data: fileBuffer })
      const result = await parser.getText()
      await parser.destroy()
      textContent = result.text
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 })
    }

    // Calculate word count
    const wordCount = textContent.trim().split(/\s+/).length

    // Use AI to analyze the document
    const analysis = await AIService.analyzeDocument(textContent)

    // Save to database
    const document = await prisma.textDocument.create({
      data: {
        name,
        description: description || null,
        fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
        fileName: file.name,
        fileSize: file.size,
        wordCount,
        content: textContent,
        themes: analysis.themes,
        sentiment: analysis.sentiment,
        keywords: analysis.keywords,
        summary: analysis.summary,
        userId: session.user.id
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload and analyze document' },
      { status: 500 }
    )
  }
}
