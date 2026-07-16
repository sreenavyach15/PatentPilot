"use client";

import { getGooglePatentUrl } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const QUICK_NAV_ITEMS = [
  { id: "compound-information", label: "Compound Information" },
  { id: "related-patents", label: "Related Patents" },
  { id: "patentability-report", label: "Patentability Report" },
] as const;

/** Maps a risk/recommendation string to a consistent color treatment used across the page. */
function riskTone(raw?: string) {
  const value = (raw || "").toLowerCase();

  if (value.includes("low")) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      stroke: "stroke-emerald-500",
    };
  }

  if (value.includes("high")) {
    return {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
      stroke: "stroke-rose-500",
    };
  }

  if (
    value.includes("medium") ||
    value.includes("moderate") ||
    value.includes("expert") ||
    value.includes("review")
  ) {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
      stroke: "stroke-amber-500",
    };
  }

  return {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    stroke: "stroke-slate-400",
  };
}

function RiskBadge({ value }: { value: string }) {
  const tone = riskTone(value);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold font-sans ${tone.bg} ${tone.text} ${tone.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {value}
    </span>
  );
}

/** Small circular gauge for a 0-100 score. Purely presentational; the numeric value shown is unchanged. */
function ScoreRing({
  value,
  label,
  strokeClass,
}: {
  value: number;
  label: string;
  strokeClass: string;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-slate-100" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={strokeClass}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-sans text-sm font-bold text-slate-800">
          {value}%
        </span>
      </div>
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}

function QuickNav({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Quick section navigation"
      className="flex w-[248px] flex-col rounded-[20px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/40"
    >
      <p className="px-2 pb-3 font-sans text-[11px] font-bold uppercase tracking-widest text-slate-400">
        Jump to section
      </p>

      <div className="flex flex-col gap-1">
        {QUICK_NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group relative flex w-full items-center whitespace-nowrap rounded-xl py-3 pl-5 pr-4 text-left font-sans text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-indigo-700"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-colors ${
                  isActive ? "bg-indigo-600" : "bg-transparent"
                }`}
              />
              <span className="overflow-hidden text-ellipsis">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Renders an AI explanation blob, giving Chemical Overlap / Therapeutic Overlap / Risk Level lines the same treatment used on the home page. */
function AiExplanation({ text }: { text: string }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-[15px] leading-8 text-justify text-slate-600">
      {(text || "")
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line, i) => {
          if (line.startsWith("Chemical Overlap:")) {
            return (
              <p key={i}>
                <strong className="text-slate-900">Chemical Overlap:</strong>{" "}
                {line.replace("Chemical Overlap:", "").trim()}
              </p>
            );
          }

          if (line.startsWith("Therapeutic Overlap:")) {
            return (
              <p key={i}>
                <strong className="text-slate-900">Therapeutic Overlap:</strong>{" "}
                {line.replace("Therapeutic Overlap:", "").trim()}
              </p>
            );
          }

          if (line.startsWith("Risk Level:")) {
            const levelValue = line.replace("Risk Level:", "").trim();

            return (
              <p key={i} className="flex flex-wrap items-center gap-2">
                <strong className="text-slate-900">Risk Level:</strong>
                <RiskBadge value={levelValue} />
              </p>
            );
          }

          return <p key={i}>{line}</p>;
        })}
    </div>
  );
}

/** Same prefix → jurisdiction mapping used on the home page, kept local so this file has no cross-page dependency. */
function jurisdictionFor(patentNumber: string) {
  const map: Record<string, string> = {
    "US-": "United States 🇺🇸",
    "EP-": "Europe 🇪🇺",
    "WO-": "WIPO 🌍",
    "CN-": "China 🇨🇳",
    "JP-": "Japan 🇯🇵",
    "FR-": "France 🇫🇷",
    "CH-": "Switzerland 🇨🇭",
    "BE-": "Belgium 🇧🇪",
    "DE-": "Germany 🇩🇪",
    "GB-": "United Kingdom 🇬🇧",
    "KR-": "South Korea 🇰🇷",
  };

  const prefix = Object.keys(map).find((p) => (patentNumber || "").startsWith(p));
  return prefix ? map[prefix] : null;
}

export default function HistoryDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [analysis, setAnalysis] = useState<any>(null);
  const [patents, setPatents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("");

  const report = analysis?.report;
  const hasResults = Boolean(analysis);
  const manualScrollRef = useRef(false);
  const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  async function loadAnalysis() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/history/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Couldn't load this analysis.");
      }

      setAnalysis(data.analysis);
      setPatents(data.patents || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasResults) {
      setActiveSection("");
      return;
    }

    const sectionIds = QUICK_NAV_ITEMS.map((item) => item.id);

    const observer = new IntersectionObserver(
      (entries) => {
        if (manualScrollRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0.1 }
    );

    sectionIds.forEach((sid) => {
      const el = document.getElementById(sid);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [hasResults, patents.length, report]);

  function handleNavigate(sectionId: string) {
    setActiveSection(sectionId);
    manualScrollRef.current = true;

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (manualScrollTimeoutRef.current) {
      clearTimeout(manualScrollTimeoutRef.current);
    }

    manualScrollTimeoutRef.current = setTimeout(() => {
      manualScrollRef.current = false;
    }, 800);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl shadow-slate-300/40 ring-1 ring-slate-200">
          <span className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
          <span className="font-sans text-sm font-semibold text-slate-600">Loading analysis…</span>
        </div>
      </main>
    );
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-slate-300/40 ring-1 ring-slate-200">
          <p className="font-sans text-sm font-semibold text-rose-700">
            {error || "This analysis couldn't be found."}
          </p>
          <Link
            href="/history"
            className="font-sans mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-900"
          >
            ← Back to History
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex justify-center p-6 sm:p-8">
      <div className="flex w-full max-w-[1320px] items-start justify-center gap-8">

        <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200">
          {/* Accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-950 via-blue-800 to-blue-500" />

          <div className="p-6 sm:p-10">

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-100 pb-8">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-950 text-lg font-bold text-amber-400 shadow-lg shadow-indigo-950/20">
                  PP
                </div>

                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-slate-900 capitalize">
                    {analysis.compound_name}
                  </h1>

                  <p className="font-sans text-slate-500 mt-1 text-sm">
                    Saved Patentability Assessment
                  </p>
                </div>
              </div>

              <Link
                href="/history"
                className="font-sans inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-900"
              >
                ← Back to History
              </Link>

            </div>

            {/* Compound Information */}
            <div id="compound-information" className="mt-10">
              <p className="font-sans mb-3 text-[11px] font-bold uppercase tracking-widest text-indigo-600/70">
                Molecular Profile
              </p>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                  <span className="text-lg">🧪</span>
                  <h2 className="text-xl font-bold text-slate-900">
                    Compound Information
                  </h2>
                </div>

                <div className="p-6 sm:p-8">

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-[15px]">

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</p>
                      <p className="mt-1 font-semibold text-slate-900">{analysis.compound_name}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">PubChem CID</p>
                      <p className="mt-1 font-semibold text-slate-900">{analysis.pubchem_cid ?? "—"}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Molecular Formula</p>
                      <p className="mt-1 font-semibold text-slate-900">{analysis.molecular_formula ?? "—"}</p>
                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-[15px]">

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Target</p>
                      <p className="mt-1 font-semibold text-slate-900">{analysis.target || "—"}</p>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Disease</p>
                      <p className="mt-1 font-semibold text-slate-900">{analysis.disease || "—"}</p>
                    </div>

                  </div>

                  <div className="mt-5">
                    <p className="font-sans font-semibold text-slate-900 mb-2 text-[15px]">
                      Canonical SMILES:
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 break-all text-sm font-mono text-emerald-300">
                      {analysis.smiles}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Related Patents */}
            {patents.length > 0 && (
              <div id="related-patents" className="mt-10">
                <p className="font-sans mb-3 text-[11px] font-bold uppercase tracking-widest text-indigo-600/70">
                  Patent Landscape
                </p>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      <h2 className="text-xl font-bold text-slate-900">
                        Related Patents
                      </h2>
                    </div>
                    <span className="font-sans rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                      {patents.length} found
                    </span>
                  </div>

                  <div className="space-y-5 p-6 sm:p-8">
                    {patents.map((patent, index) => {
                      const riskMatch = (patent.ai_explanation || "").match(/Risk Level:\s*(.+)/i);
                      const riskLevel = riskMatch ? riskMatch[1].trim() : null;
                      const jurisdiction = jurisdictionFor(patent.patent_number);

                      return (
                        <div
                          key={patent.id ?? index}
                          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm transition hover:shadow-md hover:border-indigo-200"
                        >
                          {/* Patent Header */}
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-start gap-3">
                              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-950 font-sans text-xs font-bold text-amber-400">
                                {index + 1}
                              </span>
                              <h3 className="text-2xl font-bold text-slate-900 leading-snug">
                                {patent.patent_title}
                              </h3>
                            </div>

                            {riskLevel && (
                              <div className="shrink-0">
                                <RiskBadge value={riskLevel} />
                              </div>
                            )}
                          </div>

                          {/* Patent Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 font-sans text-[15px] text-slate-700 rounded-xl bg-slate-50 border border-slate-100 p-4">

                            <p>
                              <span className="font-semibold text-slate-900">Patent No:</span>{" "}
                              {patent.patent_number}
                            </p>

                            {jurisdiction && (
                              <p>
                                <span className="font-semibold text-slate-900">Jurisdiction:</span>{" "}
                                {jurisdiction}
                              </p>
                            )}

                            <p>
                              <span className="font-semibold text-slate-900">Assignee:</span>{" "}
                              {patent.assignee && patent.assignee !== "null" ? patent.assignee : "Unknown"}
                            </p>

                          </div>

                          {/* Scores */}
                          <div className="mt-5 flex flex-col sm:flex-row gap-4">
                            <ScoreRing
                              value={patent.relevance_score}
                              label="Relevance Score"
                              strokeClass="stroke-indigo-600"
                            />
                            <ScoreRing
                              value={patent.confidence_score}
                              label="Confidence"
                              strokeClass="stroke-emerald-500"
                            />
                          </div>

                          {/* AI Analysis */}
                          <div className="mt-6">
                            <h4 className="text-base font-semibold text-slate-900 mb-2.5">
                              AI Analysis
                            </h4>

                            <AiExplanation text={patent.ai_explanation} />
                          </div>

                          {/* Google Patent Button */}
                          <div className="mt-7 flex flex-wrap items-center gap-3">
                            <a
                              href={getGooglePatentUrl(patent.patent_number)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-sans inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-white text-sm font-medium shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
                            >
                              🔗 View on Google Patents
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Patentability Report */}
            {report && (
              <div id="patentability-report" className="mt-10">
                <p className="font-sans mb-3 text-[11px] font-bold uppercase tracking-widest text-indigo-600/70">
                  Risk Assessment
                </p>

                <div className="overflow-hidden rounded-2xl border border-indigo-100">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-indigo-950 px-6 py-5 sm:px-8">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      <h2 className="text-xl font-bold text-white">
                        Patentability Report
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <RiskBadge value={report.overallRisk} />
                      <span className="font-sans rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
                        Score {report.overallScore}
                      </span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/40 p-6 sm:p-8">
                    <div className="space-y-6 font-sans text-[15px] text-slate-700">

                      <div className="rounded-xl bg-white border border-indigo-100 p-5">
                        <p className="font-semibold text-slate-900 mb-1.5">
                          Executive Summary
                        </p>

                        <p className="leading-7">
                          {report.executiveSummary}
                        </p>
                      </div>

                      {report.keySimilarPatents?.length > 0 && (
                        <div className="rounded-xl bg-white border border-indigo-100 p-5">
                          <p className="font-semibold text-slate-900 mb-2">
                            Key Similar Patents
                          </p>

                          <ul className="list-disc list-inside space-y-2 leading-7">
                            {report.keySimilarPatents.map((patent: any, index: number) => (
                              <li key={index}>
                                <strong className="text-slate-900">{patent.patentNumber}</strong>
                                {" — "}
                                {patent.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-xl bg-white border border-indigo-100 p-5">
                        <p className="font-semibold text-slate-900 mb-1.5">
                          Potential Novelty Concerns
                        </p>

                        <p className="leading-7">
                          {report.noveltyConcerns}
                        </p>
                      </div>

                      {report.manualReviewPatents?.length > 0 && (
                        <div className="rounded-xl bg-white border border-indigo-100 p-5">
                          <p className="font-semibold text-slate-900 mb-2">
                            Patents Requiring Manual Review
                          </p>

                          <ul className="list-disc list-inside space-y-2 leading-7">
                            {report.manualReviewPatents.map((patent: any, index: number) => (
                              <li key={index}>
                                <strong className="text-slate-900">{patent.patentNumber}</strong>
                                {" — "}
                                {patent.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4">
                        <div className="flex flex-1 items-center justify-between gap-4 rounded-xl bg-white border border-indigo-100 px-5 py-4">
                          <span className="font-semibold text-slate-900">Overall Risk</span>
                          <RiskBadge value={report.overallRisk} />
                        </div>

                        <div className="flex flex-1 items-center justify-between gap-4 rounded-xl bg-white border border-indigo-100 px-5 py-4">
                          <span className="font-semibold text-slate-900">Overall Score</span>
                          <span className="text-lg font-bold text-indigo-700">{report.overallScore}</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-indigo-100 p-5">
                        <p className="font-semibold text-slate-900 mb-1.5">
                          Scoring Methodology
                        </p>

                        <p className="leading-7">
                          {report.scoringMethodology}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-indigo-100 p-5">
                        <p className="font-semibold text-slate-900 mb-1.5">
                          Recommendation
                        </p>

                        <p className="leading-7">
                          {report.recommendation}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-indigo-100 p-5">
                        <p className="font-semibold text-slate-900 mb-1.5">
                          Justification
                        </p>

                        <p className="leading-7">
                          {report.justification}
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {hasResults && (
          <div className="hidden 2xl:flex sticky top-10 shrink-0 flex-col gap-4">
            <QuickNav activeSection={activeSection} onNavigate={handleNavigate} />

            <div className="w-[248px] rounded-2xl border border-amber-200 bg-amber-50 p-4 font-sans text-sm leading-6 text-amber-900">
              <strong>ℹ Note:</strong> Some patents may open in their original language. Google Patents often provides an English translation if available.
            </div>
          </div>
        )}

      </div>
    </main>
  );
}