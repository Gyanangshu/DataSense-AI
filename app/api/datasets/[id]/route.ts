import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/datasets/[id]
 * Fetches a single dataset if it belongs to the authenticated user.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch by the unique ID
    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
    })

    // 2. Check for existence and ownership
    if (!dataset || dataset.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Dataset not found or you do not have permission to view it' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataset)

  } catch (error) {
    console.error(`Failed to fetch dataset ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/datasets/[id]
 * Deletes a single dataset if it belongs to the authenticated user.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params first
    const resolvedParams = await params

    // Then parse the JSON string
    let datasetId = resolvedParams.id
    try {
      const parsed = JSON.parse(decodeURIComponent(resolvedParams.id))
      if (parsed.id) {
        datasetId = parsed.id
      }
    } catch (e) {
      // It's not JSON, so use it directly
      datasetId = decodeURIComponent(resolvedParams.id)
    }

    // 1. Verify ownership before deleting
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId, userId: session.user.id },
    })

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    // 2. Delete associated visualizations first (important for relational integrity)
    await prisma.visualization.deleteMany({
      where: { datasetId: datasetId },
    })

    // 3. Then delete the dataset
    await prisma.dataset.delete({
      where: { id: datasetId },
    })

    return NextResponse.json({ message: 'Dataset deleted successfully' }, { status: 200 })

  } catch (error) {
    console.error(`Failed to delete dataset ${params}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    )
  }
}