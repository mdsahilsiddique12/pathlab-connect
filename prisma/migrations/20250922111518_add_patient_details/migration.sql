/*
  Warnings:

  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `technicians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `prescriptionUrl` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `technicianId` on the `appointments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "admins_email_key";

-- DropIndex
DROP INDEX "configurations_key_key";

-- DropIndex
DROP INDEX "technicians_phone_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "admins";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "configurations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "messages";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "technicians";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "collectionDate" DATETIME NOT NULL,
    "timeSlot" TEXT,
    "tests" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "address" TEXT,
    "prescriptionImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_appointments" ("address", "collectionDate", "createdAt", "customerId", "id", "notes", "status", "tests", "timeSlot", "updatedAt") SELECT "address", "collectionDate", "createdAt", "customerId", "id", "notes", "status", "tests", "timeSlot", "updatedAt" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
