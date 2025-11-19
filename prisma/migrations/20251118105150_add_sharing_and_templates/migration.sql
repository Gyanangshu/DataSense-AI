-- AlterTable
ALTER TABLE "users" ADD COLUMN     "brandingConfig" JSONB;

-- CreateTable
CREATE TABLE "analysis_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "userId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_analyses" (
    "id" TEXT NOT NULL,
    "shareType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "shareMode" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "password" TEXT,
    "expiresAt" TIMESTAMP(3),
    "brandingConfig" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_views" (
    "id" TEXT NOT NULL,
    "sharedAnalysisId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "referrer" TEXT,
    "deviceType" TEXT,
    "country" TEXT,
    "city" TEXT,
    "timeSpent" INTEGER,

    CONSTRAINT "share_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_templates_category_idx" ON "analysis_templates"("category");

-- CreateIndex
CREATE INDEX "analysis_templates_userId_idx" ON "analysis_templates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_analyses_slug_key" ON "shared_analyses"("slug");

-- CreateIndex
CREATE INDEX "shared_analyses_slug_idx" ON "shared_analyses"("slug");

-- CreateIndex
CREATE INDEX "shared_analyses_userId_idx" ON "shared_analyses"("userId");

-- CreateIndex
CREATE INDEX "shared_analyses_resourceId_idx" ON "shared_analyses"("resourceId");

-- CreateIndex
CREATE INDEX "share_views_sharedAnalysisId_idx" ON "share_views"("sharedAnalysisId");

-- CreateIndex
CREATE INDEX "share_views_viewedAt_idx" ON "share_views"("viewedAt");

-- AddForeignKey
ALTER TABLE "analysis_templates" ADD CONSTRAINT "analysis_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_analyses" ADD CONSTRAINT "shared_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_views" ADD CONSTRAINT "share_views_sharedAnalysisId_fkey" FOREIGN KEY ("sharedAnalysisId") REFERENCES "shared_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
