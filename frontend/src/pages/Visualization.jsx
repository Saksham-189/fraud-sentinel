import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, TopNavbar, ToastNotification } from "./Dashboard";
import { Reveal } from "../components/Motion";
import { analysisApi } from "../services/api";
import { buildLegacyIntelligenceFallback, IntelligenceDetails } from "../components/Intelligence";
import { DoodleWall, EvidenceTape, GraffitiTag } from "../components/StreetArt";

function Card({ children, className = "" }) {
  return <section className={`glass-card ${className}`}>{children}</section>;
}

function getReportText(record) {
  const input = record?.input || {};
  const result = record?.result || {};
  if (input.text) return String(input.text);
  if (Array.isArray(input.messages)) return input.messages.map((message) => message?.text || "").filter(Boolean).join("\n");
  if (Array.isArray(result.messages_analysis)) return result.messages_analysis.map((message) => message?.text || "").filter(Boolean).join("\n");
  return "";
}

function buildReport(record) {
  const result = record?.result || {};
  const input = record?.input || {};
  const intelligence = buildLegacyIntelligenceFallback(result, input);
  return {
    id: record?.id,
    timestamp: record?.timestamp,
    text: getReportText(record),
    intelligence,
    raw: record,
  };
}

function MetadataAndExport({ report, onToast }) {
  const intelligence = report.intelligence;
  const summary = intelligence.shareable_summary || `${intelligence.risk_level} RISK (${Math.round(Number(intelligence.confidence || 0) * 100)}% confidence): ${intelligence.classification?.primary}. Recommended action: ${(intelligence.recommended_actions || []).slice(0, 3).join("; ")}.`;

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      onToast("Summary copied", "The report summary is ready to paste.");
    } catch {
      onToast("Copy unavailable", summary);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report.raw || report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fraud-report-${report.id || "analysis"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareReport = async () => {
    const shareData = { title: "FraudSentinel Case Report", text: summary, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      onToast("Report link copied", "Share the copied link when you need to report or document the analysis.");
    }
  };

  return (
    <Card className="p-6 case-sheet overflow-hidden">
      <DoodleWall tag="REPORT" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <GraffitiTag tone="yellow">Report Metadata</GraffitiTag>
          <h2 className="font-headline font-black text-[var(--text-primary)] flex items-center gap-2 mt-4">
            <span className="material-symbols-outlined text-accent-cyan text-[20px]">info</span>
            Analysis Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-4">
            <p><span className="font-bold text-[var(--text-tertiary)]">Date:</span> {report.timestamp ? new Date(report.timestamp).toLocaleString() : "Current session"}</p>
            <p><span className="font-bold text-[var(--text-tertiary)]">Risk Score:</span> {Math.round(Number(intelligence.risk_score || 0) * 100)}/100</p>
            <p><span className="font-bold text-[var(--text-tertiary)]">Confidence:</span> {Math.round(Number(intelligence.confidence || 0) * 100)}%</p>
            <p><span className="font-bold text-[var(--text-tertiary)]">Analysis ID:</span> {report.id || "Unsaved analysis"}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-md bg-[var(--text-primary)] text-[var(--surface-0)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Download PDF
          </button>
          <button onClick={copySummary} className="px-4 py-2 rounded-md bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">content_copy</span> Copy Summary
          </button>
          <button onClick={shareReport} className="px-4 py-2 rounded-md bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">ios_share</span> Share
          </button>
          <button onClick={downloadJson} className="px-4 py-2 rounded-md bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">data_object</span> JSON
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function IntelligenceReport() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, title: "", subtext: "" });
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    async function loadReport() {
      setLoading(true);
      setError("");
      try {
        const data = id ? await analysisApi.getConversation(id) : await analysisApi.getHistory();
        if (cancelled) return;
        if (data?.error) {
          setError(data.error);
          setRecord(null);
        } else if (Array.isArray(data)) {
          setRecord(data[0] || null);
        } else {
          setRecord(data);
        }
      } catch {
        if (!cancelled) setError("Unable to load intelligence report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReport();
    return () => { cancelled = true; };
  }, [location.search]);

  const report = useMemo(() => (record ? buildReport(record) : null), [record]);
  const triggerToast = (title, subtext) => setToast({ show: true, title, subtext });

  return (
    <div className="app-shell min-h-screen flex font-body overflow-x-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-grow flex flex-col min-w-0 relative z-10">
        <TopNavbar title="Forensic Case Report" />
        <main className="flex-grow p-4 md:p-8 max-w-[1280px] mx-auto w-full pb-20">
          {loading && (
            <div className="min-h-[400px] flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-[40px] text-accent-cyan">progress_activity</span>
            </div>
          )}

          {!loading && (!report || error) && (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-1)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">description</span>
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">No analysis report available</h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-2">{error || "Run an analysis first, then open the report from History."}</p>
              <Link to="/analyze" className="inline-flex mt-5 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold">Analyze Message</Link>
            </Card>
          )}

          {!loading && report && (
            <Reveal>
              <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <GraffitiTag tone="coral">Evidence Wall</GraffitiTag>
                  <h1 className="text-3xl font-headline font-black text-[var(--text-primary)] tracking-tight mt-3">Forensic Case Report</h1>
                  <p className="text-[var(--text-secondary)] mt-1">Decision-ready explanation, evidence, confidence, and next steps.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <EvidenceTape>FOLLOW THE EVIDENCE</EvidenceTape>
                  <Link to="/history" className="text-sm font-bold text-[var(--text-secondary)] hover:text-accent-cyan flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to History
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                <IntelligenceDetails intelligence={report.intelligence} text={report.text} />
                <MetadataAndExport report={report} onToast={triggerToast} />
              </div>
            </Reveal>
          )}
        </main>
      </div>
      <ToastNotification show={toast.show} message={toast.title} subtext={toast.subtext} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
