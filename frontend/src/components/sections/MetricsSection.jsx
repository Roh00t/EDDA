import { StatCounter } from "performative-ui";

export default function MetricsSection({ stats }) {
  return (
    <section className="section metrics-section">
      {stats.map((item) => (
        <article className="metric-card" key={item.label}>
          <p className="metric-value">
            <StatCounter target={item.value} />
            {item.suffix}
          </p>
          <p className="metric-label">{item.label}</p>
        </article>
      ))}
    </section>
  );
}
