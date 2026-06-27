import { Aurora, Button, EyebrowPill, GradientText, StatusDot } from "performative-ui";

export default function HeroSection({ onPrimaryAction, onSecondaryAction }) {
  return (
    <header className="hero-shell">
      <Aurora className="hero-aurora" blur={90} animated repulsion={0.2} />
      <div className="hero-content">
        <EyebrowPill className="hero-eyebrow" statusColor="#22c55e">
          <StatusDot color="#22c55e" static /> Trust-first due diligence platform
        </EyebrowPill>
        <h1>
          See employer risk before you say yes with <GradientText>signals, not verdicts.</GradientText>
        </h1>
        <p>
          EDDA turns unstructured job descriptions into evidence-backed risk reports, combining posting analysis with grounded
          employer research and explicit provenance tagging.
        </p>
        <div className="hero-actions">
          <Button variant="wave" onClick={onPrimaryAction}>
            Open analysis workbench
          </Button>
          <Button variant="ghost" onClick={onSecondaryAction}>
            Load instant preview
          </Button>
        </div>
      </div>
    </header>
  );
}
