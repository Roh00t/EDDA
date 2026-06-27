import { Button, PricingCard } from "performative-ui";

function PricingTile({ tier }) {
  return (
    <PricingCard className={`pricing-tile ${tier.highlighted ? "pricing-featured" : ""}`}>
      <h3>{tier.name}</h3>
      <p className="pricing-tagline">{tier.description}</p>
      <p className="pricing-price">
        {tier.price}
        <span>{tier.cadence}</span>
      </p>
      <ul>
        {tier.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <Button variant={tier.highlighted ? "shimmer" : "solid"}>Start plan</Button>
    </PricingCard>
  );
}

export default function PricingSection({ tiers }) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>Simple plans for individuals and teams</h2>
        <p>Use EDDA as a standalone diligence workspace or plug it into your hiring operations stack.</p>
      </div>
      <div className="pricing-grid">
        {tiers.map((tier) => (
          <PricingTile tier={tier} key={tier.name} />
        ))}
      </div>
    </section>
  );
}
