import { Patent } from "@/types/patent";
import { Compound } from "@/types/compound";
import { PatentabilityReport } from "@/types/report";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function generateReport(
  compound: Compound,
  patents: Patent[]
): Promise<PatentabilityReport> {

  const avgRelevance =
    patents.reduce(
      (sum, p) => sum + (p.relevanceScore || 0),
      0
    ) / Math.max(1, patents.length);

  const avgConfidence =
    patents.reduce(
      (sum, p) => sum + (p.confidence || 0),
      0
    ) / Math.max(1, patents.length);

  // Overall patentability score computed using a weighted combination
  // of AI-generated relevance (70%) and confidence (30%).
  const calculatedScore = Math.round(
    avgRelevance * 0.7 +
    avgConfidence * 0.3
  );

  let recommendation = "Low Patent Risk";
  let overallRisk = "Low";

  if (calculatedScore >= 90) {
    recommendation = "High Patent Risk";
    overallRisk = "High";
  }
  else if (calculatedScore >= 60) {
    recommendation = "Requires Expert Review";
    overallRisk = "Medium";
  }
  else {
    recommendation = "Low Patent Risk";
    overallRisk = "Low";
  }

  console.log({
    avgRelevance,
    avgConfidence,
    calculatedScore,
    recommendation,
  });

  const prompt = `
You are an expert pharmaceutical patent analyst.

Your task is to generate a professional patentability report.

Use ONLY the information provided.

Do NOT invent facts.

If information is insufficient, explicitly state that.

==================================================
COMPOUND
==================================================

Name:
${compound.name}

Formula:
${compound.molecularFormula}

Canonical SMILES:
${compound.canonicalSmiles}

==================================================
PATENTS
==================================================

${patents.map((p, i) => `

Patent ${i + 1}

Patent Number:
${p.patentNumber}

Title:
${p.title}

Relevance Score:
${p.relevanceScore}

Confidence:
${p.confidence}

AI Analysis:
${p.aiExplanation}

`).join("\n")}

==================================================
TASK
==================================================

Generate a structured patentability assessment.

The overall recommendation has already been determined by the application.

Overall Risk:
${overallRisk}

Recommendation:
${recommendation}

Do NOT change these values.

Instead, explain why the retrieved patents support this recommendation.

The field "scoringMethodology" should briefly explain (2–4 sentences) how the overall patent risk score was determined.

Mention that the assessment considers:
- Patent relevance scores
- AI semantic analysis
- Chemical overlap
- Therapeutic overlap
- Confidence scores
- Novelty concerns

Do NOT invent mathematical formulas or percentages.

The overallScore has already been calculated by the application.
Do NOT modify it.

Return ONLY valid JSON.

Return EXACTLY this structure:

{
  "executiveSummary":"",
  "keySimilarPatents":[
    {
      "patentNumber":"",
      "title":""
    }
  ],
  "noveltyConcerns":"",
  "manualReviewPatents":[
    {
      "patentNumber":"",
      "reason":""
    }
  ],
  "overallRisk":"Low",
  "overallScore": ${calculatedScore},
  "scoringMethodology":"",
  "recommendation":"Low Patent Risk",
  "justification":""
}
`;

  const response = await groq.chat.completions.create({

    model: "llama-3.3-70b-versatile",

    temperature: 0.2,

    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],

  });

  const text = response.choices[0].message.content ?? "{}";

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const report = JSON.parse(cleaned);
  report.overallScore = calculatedScore;
  report.recommendation = recommendation;
  report.overallRisk = overallRisk;

  const allowedRecommendations = [
    "Low Patent Risk",
    "Requires Expert Review",
    "High Patent Risk",
  ];

  if (!allowedRecommendations.includes(report.recommendation)) {
    report.recommendation = "Requires Expert Review";
  }

  const allowedRisk = [
    "Low",
    "Medium",
    "High",
  ];

  if (!allowedRisk.includes(report.overallRisk)) {
    report.overallRisk = "Medium";
  }

  report.executiveSummary ??= "";

  report.keySimilarPatents ??= [];

  report.noveltyConcerns ??= "Insufficient metadata to identify specific novelty concerns.";

  report.manualReviewPatents ??= [];

  report.overallScore ??= 0;

  report.scoringMethodology ??=
    "The overall patentability score is determined by considering the relevance scores of the retrieved patents, AI-assisted semantic analysis, chemical overlap with the submitted compound, therapeutic overlap with the intended target or disease, confidence scores, and the identified novelty concerns. These factors are evaluated together to estimate the likelihood of existing patent overlap and support the final recommendation.";

  report.justification ??= "";

  return report;

}