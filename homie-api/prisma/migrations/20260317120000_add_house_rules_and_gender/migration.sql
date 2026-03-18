-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "SmokingPolicy" AS ENUM ('NOT_ALLOWED', 'OUTSIDE_ONLY', 'ALLOWED');

-- CreateEnum
CREATE TYPE "PetsPolicy" AS ENUM ('NOT_ALLOWED', 'SMALL_ONLY', 'ALLOWED');

-- CreateEnum
CREATE TYPE "PartiesPolicy" AS ENUM ('NOT_ALLOWED', 'OCCASIONAL', 'ALLOWED');

-- CreateEnum
CREATE TYPE "OvernightGuestsPolicy" AS ENUM ('NOT_ALLOWED', 'WITH_NOTICE', 'ALLOWED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "gender" "UserGender";
ALTER TABLE "users" ADD COLUMN "preferredCity" TEXT;
ALTER TABLE "users" ADD COLUMN "preferredCities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "preferredLatitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "preferredLongitude" DOUBLE PRECISION;

-- AlterTable (Boost)
ALTER TABLE "listings" ADD COLUMN "boostedUntil" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "boostStripePaymentId" TEXT;

-- CreateTable
CREATE TABLE "house_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "smokingPolicy" "SmokingPolicy" NOT NULL DEFAULT 'NOT_ALLOWED',
    "petsPolicy" "PetsPolicy" NOT NULL DEFAULT 'NOT_ALLOWED',
    "partiesPolicy" "PartiesPolicy" NOT NULL DEFAULT 'NOT_ALLOWED',
    "overnightGuests" "OvernightGuestsPolicy" NOT NULL DEFAULT 'WITH_NOTICE',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "cleanlinessLevel" INTEGER NOT NULL,
    "preferredGender" "Gender",
    "maxOccupants" INTEGER,

    CONSTRAINT "house_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "house_rules_userId_key" ON "house_rules"("userId");

-- AddForeignKey
ALTER TABLE "house_rules" ADD CONSTRAINT "house_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
