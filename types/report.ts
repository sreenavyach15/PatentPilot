export interface PatentabilityReport {

  executiveSummary: string;

  keySimilarPatents: {
    patentNumber: string;
    title: string;
  }[];

  noveltyConcerns: string;

  manualReviewPatents: {
    patentNumber: string;
    reason: string;
  }[];

  overallRisk: "Low" | "Medium" | "High";

  overallScore: number;

  scoringMethodology: string;

  recommendation:
    | "Low Patent Risk"
    | "Requires Expert Review"
    | "High Patent Risk";

  justification: string;

}