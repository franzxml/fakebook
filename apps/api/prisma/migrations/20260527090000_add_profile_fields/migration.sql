ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "email_verified_at" DATETIME;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
