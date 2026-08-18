import type { AdminTenant } from "@/types/business";
export function TenantTable({ tenants }: { tenants: AdminTenant[] }) {
  return (
    <section className="admin-table-panel glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO TENANTS</span>
          <h2>Tenant management</h2>
        </div>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Environment</th>
              <th>Status</th>
              <th>Users</th>
              <th>Plan</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                  <small>{t.id}</small>
                </td>
                <td>{t.environment}</td>
                <td>{t.status}</td>
                <td>{t.users}</td>
                <td>{t.plan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
