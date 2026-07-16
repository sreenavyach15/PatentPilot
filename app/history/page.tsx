"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Analysis {
  id: number;
  smiles: string;
  target: string;
  disease: string;
  compound_name: string;
  recommendation: string;
  risk_score: number;
  created_at: string;
}

/** Same tone mapping used on the home and detail pages, so risk colors read identically everywhere. */
function riskTone(raw?: string) {
  const value = (raw || "").toLowerCase();

  if (value.includes("low")) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
    };
  }

  if (value.includes("high")) {
    return {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
      bar: "bg-rose-500",
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
      bar: "bg-amber-500",
    };
  }

  return {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
  };
}

function RiskBadge({ value }: { value: string }) {
  const tone = riskTone(value);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold font-sans ${tone.bg} ${tone.text} ${tone.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {value || "Pending"}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 font-sans">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="truncate text-right text-sm font-semibold text-slate-800">
        {value || "—"}
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const searchParams = useSearchParams();

  useEffect(() => {
    const value = searchParams.get("search") ?? "";
    setSearchTerm(value);
  }, [searchParams]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const response = await fetch("/api/history");
    const data = await response.json();
    setHistory(data);
    setLoading(false);
  }


  const filteredHistory = [...history]
    .filter((item) => {
      const query = searchTerm.trim().toLowerCase();

      return (
        item.compound_name?.toLowerCase().includes(query) ||
        item.smiles?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );

        case "highest":
          return b.risk_score - a.risk_score;

        case "lowest":
          return a.risk_score - b.risk_score;

        default:
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
      }
    });


  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex justify-center p-6 sm:p-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-300/50 ring-1 ring-slate-200">
        {/* Accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-950 via-blue-800 to-blue-500" />

        <div className="p-6 sm:p-10">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Analysis History
              </h1>
              <p className="font-sans text-slate-500 mt-1 text-sm">
                {filteredHistory.length > 0
                  ? `${filteredHistory.length} compound${filteredHistory.length === 1 ? "" : "s"} found`
                  : "Your past compound analyses will appear here"}
              </p>
            </div>

            <Link
              href="/"
              className="font-sans inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-900"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[280px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredHistory.length === 0 && (
            <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 py-24 text-center">
              <p className="font-sans text-lg font-semibold text-slate-700">
                No matching analyses found
                Try a different compound name, SMILES, or sorting option.
              </p>
              <p className="font-sans mt-1 text-sm text-slate-500">
                Run a new compound analysis to see it listed here.
              </p>
            </div>
          )}

          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <input
              type="text"
              placeholder="🔍 Search by Compound Name or SMILES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-[420px] rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>

          </div>

          {/* Cards */}
          {!loading && history.length > 0 && (
            <div className="mt-10">
              <p className="font-sans mb-3 text-[11px] font-bold uppercase tracking-widest text-indigo-600/70">
                Analysis Records
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredHistory.map((item) => {
                  const tone = riskTone(item.recommendation);
                  const score = Math.max(0, Math.min(100, item.risk_score ?? 0));

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-200"
                    >
                      {/* Body */}
                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <h2 className="text-xl font-bold leading-tight text-slate-900 capitalize">
                            {item.compound_name || "Unnamed Compound"}
                          </h2>
                          <RiskBadge value={item.recommendation} />
                        </div>

                        <div className="divide-y divide-slate-100">
                          <DetailRow label="Target" value={item.target} />
                          <DetailRow label="Disease" value={item.disease} />
                          <DetailRow
                            label="Date"
                            value={new Date(item.created_at).toLocaleDateString()}
                          />
                        </div>

                        {/* Score */}
                        <div className="mt-5">
                          <div className="mb-1.5 flex items-center justify-between font-sans">
                            <span className="text-sm font-medium text-slate-500">
                              Overall Score
                            </span>
                            <span className="text-sm font-bold tabular-nums text-slate-900">
                              {score}
                              <span className="font-normal text-slate-400">/100</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${tone.bar}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <Link
                        href={`/history/${item.id}`}
                        className="group flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 transition hover:bg-indigo-600"
                      >
                        <span className="font-sans text-sm font-semibold text-slate-700 group-hover:text-white">
                          Explore details
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm transition group-hover:translate-x-0.5 group-hover:text-indigo-600">
                          →
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-10">
              <Link
                href="/"
                className="font-sans inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-900"
              >
                ← Back to Home
              </Link>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}