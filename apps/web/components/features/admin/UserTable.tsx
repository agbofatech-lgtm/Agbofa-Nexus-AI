import type { AdminUser } from "@/types/business";
export function UserTable({ users }: { users: AdminUser[] }) {
  return (
    <section className="admin-table-panel glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO USERS</span>
          <h2>User management</h2>
        </div>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Tenant</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </td>
                <td>{u.role}</td>
                <td>{u.tenantId}</td>
                <td>{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-authority-note">
        Frontend roles are display-only. Backend authorization remains
        authoritative.
      </p>
    </section>
  );
}
