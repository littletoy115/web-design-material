-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('PENDING_AUDIT', 'PENDING_MANAGER', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SALE';
ALTER TYPE "Role" ADD VALUE 'AUDIT';
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- CreateTable
CREATE TABLE "memo_documents" (
    "id" TEXT NOT NULL,
    "docNo" TEXT NOT NULL,
    "toName" TEXT NOT NULL,
    "toPosition" TEXT NOT NULL,
    "toDept" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromPosition" TEXT NOT NULL,
    "fromDept" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "rows" JSONB NOT NULL,
    "notes" TEXT,
    "status" "MemoStatus" NOT NULL DEFAULT 'PENDING_AUDIT',
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memo_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_approvals" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedByName" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "memo_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memo_documents_docNo_key" ON "memo_documents"("docNo");

-- AddForeignKey
ALTER TABLE "memo_approvals" ADD CONSTRAINT "memo_approvals_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "memo_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
