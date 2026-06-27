import { useState } from "react";

import { StickyBanner } from "performative-ui";

import { siteStats, platformSignals, workflowSteps, pricingTiers, footerColumns } from "./content/site-data.js";
import HeroSection from "./components/sections/HeroSection.jsx";
import MetricsSection from "./components/sections/MetricsSection.jsx";
import PlatformSignalsSection from "./components/sections/PlatformSignalsSection.jsx";
import WorkflowSection from "./components/sections/WorkflowSection.jsx";
import PricingSection from "./components/sections/PricingSection.jsx";
import AnalyzerSection from "./components/analysis/AnalyzerSection.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import { loadMockReport, requestLiveReport } from "./lib/report-api.js";

export default function App() {
  const [jdText, setJdText] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [reportState, setReportState] = useState({ report: null, source: "preview", loading: false });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function analyzePosting() {
    const trimmedText = jdText.trim();
    if (!trimmedText) {
      setStatus({ message: "Paste a job description first.", type: "error" });
      return;
    }

    setIsAnalyzing(true);
    setStatus({ message: "Analyzing posting and evidence network...", type: "loading" });
    setReportState((current) => ({ ...current, loading: true, report: null }));

    try {
      const report = await requestLiveReport(trimmedText);
      setReportState({ report, source: "live", loading: false });
      setStatus({ message: "Live report ready.", type: "live" });
      requestAnimationFrame(() => {
        document.getElementById("analysis-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      setReportState({ report: null, source: "live", loading: false });
      setStatus({ message: error.message || "Unexpected error while rendering the report.", type: "error" });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function initPreview() {
    try {
      const report = await loadMockReport();
      setReportState({ report, source: "preview", loading: false });
      setStatus({ message: "Preview loaded — paste a JD and run live analysis any time.", type: "preview" });
      requestAnimationFrame(() => {
        document.getElementById("analysis-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      setStatus({ message: "Could not load preview fixture.", type: "error" });
    }
  }

  function jumpToWorkbench() {
    document.getElementById("analysis-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="site-shell">
      <StickyBanner className="announcement-bar" trailing={<span>Now supporting grounded employer signal retrieval</span>}>
        Summer 2026 launch wave: EDDA Workbench is open for pilot teams.
      </StickyBanner>

      <HeroSection onPrimaryAction={jumpToWorkbench} onSecondaryAction={initPreview} />

      <main className="site-main">
        <MetricsSection stats={siteStats} />
        <PlatformSignalsSection items={platformSignals} />
        <WorkflowSection steps={workflowSteps} />
        <AnalyzerSection
          jdText={jdText}
          onJdTextChange={setJdText}
          onAnalyze={analyzePosting}
          onPreview={initPreview}
          status={status}
          reportState={reportState}
          isAnalyzing={isAnalyzing}
        />
        <PricingSection tiers={pricingTiers} />
      </main>

      <SiteFooter columns={footerColumns} />
    </div>
  );
}
