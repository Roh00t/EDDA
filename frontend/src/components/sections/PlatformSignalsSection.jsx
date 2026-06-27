import { GlassCard } from "performative-ui";

export default function PlatformSignalsSection({ items }) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>Built for high-stakes hiring decisions</h2>
        <p>EDDA keeps context, confidence, and traceability in one report structure teams can actually trust.</p>
      </div>
      <div className="signals-grid">
        {items.map((item) => (
          <GlassCard className="signal-card" breathing glowOnHover key={item.title}>
            <p className="signal-callout">{item.callout}</p>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
