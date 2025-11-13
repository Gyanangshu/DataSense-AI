import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const dataset = await prisma.dataset.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      select: {
        name: true,
        data: true
      }
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    if (!dataset.data) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 })
    }

    const data = dataset.data as Record<string, unknown>[]

    // Convert to CSV
    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true
    })

    // Return as downloadable CSV
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${dataset.name}-${Date.now()}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting dataset:', error)
    return NextResponse.json(
      { error: 'Failed to export dataset' },
      { status: 500 }
    )
  }
}
