-- CreateTable
CREATE TABLE "correlation_analyses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "datasetId" TEXT,
    "documentId" TEXT,
    "correlations" JSONB,
    "insights" JSONB,
    "narrative" TEXT,
    "config" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correlation_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "correlation_analyses_userId_idx" ON "correlation_analyses"("userId");

-- CreateIndex
CREATE INDEX "correlation_analyses_datasetId_idx" ON "correlation_analyses"("datasetId");

-- CreateIndex
CREATE INDEX "correlation_analyses_documentId_idx" ON "correlation_analyses"("documentId");

-- AddForeignKey
ALTER TABLE "correlation_analyses" ADD CONSTRAINT "correlation_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
