import type { Agent } from "@/types/agents";
export function AgentCostBreakdown({ agents }: { agents: Agent[] }) {
  const rows = agents
    .slice(0, 12)
    .map((agent, index) => ({
      agent,
      cost: Number((12 + index * 7.35 + agent.throughput * 0.008).toFixed(2)),
      requests: 320 + index * 73,
    }));
  return (
    <section className="agent-cost-breakdown glass">
      <div className="business-panel-heading">
        <div>
          <span>DEMO ALLOCATION</span>
          <h2>Agent cost breakdown</h2>
        </div>
        <b>Not billing data</b>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Category</th>
              <th>Demo requests</th>
              <th>Demo cost</th>
              <th>Cost/request</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.agent.id}>
                <td>
                  <strong>{row.agent.id}</strong>
                  <small>{row.agent.name}</small>
                </td>
                <td>{row.agent.category}</td>
                <td>{row.requests.toLocaleString()}</td>
                <td>${row.cost}</td>
                <td>${(row.cost / row.requests).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
