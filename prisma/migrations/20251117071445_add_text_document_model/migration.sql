-- CreateTable
CREATE TABLE "text_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "wordCount" INTEGER,
    "content" TEXT NOT NULL,
    "themes" JSONB,
    "sentiment" JSONB,
    "keywords" JSONB,
    "summary" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "text_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "text_documents_userId_idx" ON "text_documents"("userId");

-- AddForeignKey
ALTER TABLE "text_documents" ADD CONSTRAINT "text_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
