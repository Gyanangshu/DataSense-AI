import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PublicShareClient from './client'

async function getShare(slug: string) {
  const share = await prisma.sharedAnalysis.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          brandingConfig: true
        }
      }
    }
  })

  if (!share) {
    return null
  }

  // Check if expired
  if (share.expiresAt && share.expiresAt < new Date()) {
    return null
  }

  return share
}

async function getResourceData(shareType: string, resourceId: string) {
  if (shareType === 'correlation') {
    return await prisma.correlationAnalysis.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        name: true,
        description: true,
        correlations: true,
        insights: true,
        narrative: true,
        createdAt: true
      }
    })
  } else if (shareType === 'dashboard') {
    return await prisma.dashboard.findUnique({
      where: { id: resourceId },
      include: {
        visualizations: {
          include: {
            dataset: {
              select: {
                name: true,
                columns: true,
                data: true
              }
            }
          }
        }
      }
    })
  }

  return null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const share = await getShare(slug)

  if (!share) {
    return {
      title: 'Share Not Found - DataSense AI'
    }
  }

  const resourceData = await getResourceData(share.shareType, share.resourceId)

  if (!resourceData) {
    return {
      title: 'Analysis Not Found - DataSense AI'
    }
  }

  const title = `${resourceData.name} - DataSense AI`
  const description = resourceData.description || 'Mixed-methods research analysis powered by AI'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${slug}`
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  }
}

export default async function PublicSharePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const share = await getShare(slug)

  if (!share) {
    notFound()
  }

  // If password protected, don't fetch data server-side
  const isPasswordProtected = !!share.password

  let resourceData = null
  if (!isPasswordProtected) {
    resourceData = await getResourceData(share.shareType, share.resourceId)

    if (!resourceData) {
      notFound()
    }
  }

  const brandingConfig = share.brandingConfig || share.user.brandingConfig

  return (
    <PublicShareClient
      slug={slug}
      shareType={share.shareType}
      isPasswordProtected={isPasswordProtected}
      initialData={resourceData}
      brandingConfig={brandingConfig}
      viewCount={share.viewCount}
    />
  )
}
