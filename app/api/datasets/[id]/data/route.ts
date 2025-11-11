import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DataService, PaginatedData } from '@/lib/services/data.service'

export async function GET(
  req: NextRequest,
  context: { params?: { id?: string } } = {}
) {
  try {
    // Resolve params if it's a Promise or just a plain object
    const maybeParams = await Promise.resolve(context?.params)
    let datasetId = maybeParams?.id

    // Defensive fallback: extract id from pathname if params missing
    if (!datasetId) {
      const parts = req.nextUrl.pathname.split('/').filter(Boolean)
      // expected: ['api','datasets','<id>','data']
      datasetId = parts[2]
    }

    if (!datasetId) {
      return NextResponse.json({ error: 'Missing dataset id' }, { status: 400 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ... parse query params safely (limit, offset, etc.)
    const searchParams = req.nextUrl.searchParams
    const limitRaw = Number(searchParams.get('limit') ?? 100)
    const offsetRaw = Number(searchParams.get('offset') ?? 0)
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 100
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0
    const sortBy = searchParams.get('sortBy') ?? undefined
    const sortOrderParam = searchParams.get('sortOrder') ?? 'asc'
    const sortOrder = sortOrderParam.toLowerCase() === 'desc' ? 'desc' : 'asc'
    const columnsParam = searchParams.get('columns')
    const columns = columnsParam ? columnsParam.split(',').filter(Boolean) : undefined

    // Verify dataset ownership
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: session.user.id },
      select: { id: true },
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // This returns the PaginatedData shape you defined
    const result: PaginatedData = await DataService.getPaginatedData({
      datasetId,
      columns,
      limit,
      offset,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Data fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
