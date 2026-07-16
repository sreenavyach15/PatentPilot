import { supabase } from "@/lib/supabase";
import { Patent } from "@/types/patent";
import { Compound } from "@/types/compound";
import { PatentabilityReport } from "@/types/report";

function formatDateForDB(date?: string | null) {
  if (!date) return null;

  const cleaned = date.trim();

  if (!/^\d{8}$/.test(cleaned)) {
    return null;
  }

  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
}

export async function saveAnalysis(
  smiles: string,
  target: string | undefined,
  disease: string | undefined,
  compound: Compound,
  patents: Patent[],
  report: PatentabilityReport
) {

  // Save analysis
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      smiles,
      target,
      disease,
      compound_name: compound.name,
      molecular_formula: compound.molecularFormula,
      pubchem_cid: compound.cid,

      risk_score: report.overallScore,
      recommendation: report.recommendation,
      executive_summary: report.executiveSummary,

      report: report
    })
    .select()
    .single();

  if (error) {
    console.error("Analysis Insert Error:", error);
    throw error;
  }

  const analysisId = data.id;

  console.log(
    patents.map((p) => ({
      patent: p.patentNumber,
      publicationDate: p.publicationDate,
    }))
  );

  // Save patents
  const patentRows = patents.map((patent) => ({
    analysis_id: analysisId,
    patent_title: patent.title,
    patent_number: patent.patentNumber,
    publication_date: formatDateForDB(patent.publicationDate),
    assignee: patent.assignee,
    abstract: patent.abstract,
    source: patent.source,
    relevance_score: patent.relevanceScore,
    confidence_score: patent.confidence,
    ai_explanation: patent.aiExplanation,
  }));

  const { error: patentError } = await supabase
    .from("patents")
    .insert(patentRows);

  if (patentError) {
    console.error("Patent Insert Error:", patentError);
    throw patentError;
  }
}