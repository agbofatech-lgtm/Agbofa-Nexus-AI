import type { GrowthData } from "@/types/business";
export function GrowthExperiments({
  experiments,
}: {
  experiments: GrowthData["experiments"];
}) {
  return (
    <section className="experiment-table glass">
      <div className="business-panel-heading">
        <div>
          <span>FRONTEND DEMO</span>
          <h2>Growth experiments</h2>
        </div>
      </div>
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Experiment</th>
              <th>Control / Variant</th>
              <th>Metric</th>
              <th>Status</th>
              <th>Result</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.name}</strong>
                  <small>{e.hypothesis}</small>
                </td>
                <td>
                  {e.control}
                  <br />
                  {e.variant}
                </td>
                <td>{e.metric}</td>
                <td>{e.status}</td>
                <td>{e.result}</td>
                <td>{e.confidence}% demo</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
