import { authedBackendFetch, requireServerUser } from "@/lib/server/session";
import { UsersAdmin } from "@/components/admin/UsersAdmin";
import type { PaginatedResult, User } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [currentUser, users] = await Promise.all([
    requireServerUser("/admin/users"),
    authedBackendFetch<PaginatedResult<User>>("/users?limit=50"),
  ]);

  return (
    <div>
      <h2 className="font-display text-2xl uppercase text-ink">Users</h2>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Activate/deactivate accounts and change roles. You cannot change your own role, and the
        last remaining SUPER_ADMIN can&apos;t be demoted — this keeps the store from ever losing
        admin access.
      </p>
      <div className="mt-8">
        <UsersAdmin initialUsers={users} currentUserId={currentUser.id} />
      </div>
    </div>
  );
}
