-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'LOGISTIC';

-- AlterEnum
CREATE TYPE "MemoStatus_new" AS ENUM ('PENDING_AUDIT', 'PENDING_MANAGER', 'PENDING_LOGISTIC', 'DELIVERED', 'REJECTED');
ALTER TABLE "memo_documents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "memo_documents" ALTER COLUMN "status" TYPE "MemoStatus_new" USING (
  CASE "status"::text
    WHEN 'APPROVED' THEN 'DELIVERED'
    ELSE "status"::text
  END::"MemoStatus_new"
);
ALTER TYPE "MemoStatus" RENAME TO "MemoStatus_old";
ALTER TYPE "MemoStatus_new" RENAME TO "MemoStatus";
DROP TYPE "MemoStatus_old";
ALTER TABLE "memo_documents" ALTER COLUMN "status" SET DEFAULT 'PENDING_AUDIT';
