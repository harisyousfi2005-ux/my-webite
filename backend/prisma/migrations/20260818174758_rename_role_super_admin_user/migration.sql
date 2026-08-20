-- Rename Role enum values in place. ALTER TYPE ... RENAME VALUE is a
-- metadata-only operation in Postgres: every existing row's role is
-- automatically relabeled, no data is rewritten, and nothing is dropped.
-- This intentionally avoids Prisma's default "create new enum, drop old"
-- diff strategy, which would fail here because rows already use ADMIN/CUSTOMER.
ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'SUPER_ADMIN';
ALTER TYPE "Role" RENAME VALUE 'CUSTOMER' TO 'USER';
