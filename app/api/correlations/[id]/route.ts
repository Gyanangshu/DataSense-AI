import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the correlation belongs to the user before deleting
    const correlation = await prisma.correlationAnalysis.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!correlation) {
      return NextResponse.json({ error: 'Correlation analysis not found' }, { status: 404 })
    }

    // Delete the correlation
    await prisma.correlationAnalysis.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Correlation analysis deleted successfully' })
  } catch (error) {
    console.error('Correlation deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete correlation analysis' },
      { status: 500 }
    )
  }
}
