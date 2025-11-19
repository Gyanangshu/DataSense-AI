import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all templates (system templates + user's custom templates)
    const templates = await prisma.analysisTemplate.findMany({
      where: {
        OR: [
          { userId: null }, // System templates
          { userId: session.user.id } // User's templates
        ]
      },
      orderBy: [
        { category: 'asc' },
        { usageCount: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        subcategory: true,
        config: true,
        steps: true,
        isPublic: true,
        usageCount: true
      }
    })

    // Group by category
    const grouped = {
      industry: templates.filter(t => t.category === 'industry'),
      methodology: templates.filter(t => t.category === 'methodology')
    }

    return NextResponse.json({
      templates: grouped,
      total: templates.length
    })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
