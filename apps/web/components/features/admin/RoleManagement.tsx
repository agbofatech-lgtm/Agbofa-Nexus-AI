import { ShieldCheck } from "lucide-react";
const roles = ["Reader", "Editor", "Analyst", "Admin", "Superadmin"] as const;
export function RoleManagement() {
  return (
    <section className="role-management glass">
      <div className="business-panel-heading">
        <div>
          <span>UX VISIBILITY ONLY</span>
          <h2>Role management</h2>
        </div>
        <ShieldCheck size={17} />
      </div>
      <div>
        {roles.map((role, index) => (
          <article key={role}>
            <strong>{role}</strong>
            <span>
              {index === 0
                ? "Read published content"
                : index === 1
                  ? "Edit and review content"
                  : index === 2
                    ? "View intelligence and analytics"
                    : index === 3
                      ? "Manage tenant experience"
                      : "Cross-tenant platform role — backend controlled"}
            </span>
            <b>DEMO</b>
          </article>
        ))}
      </div>
    </section>
  );
}
