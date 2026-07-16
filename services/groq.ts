import Groq from "groq-sdk";
import { Patent } from "@/types/patent";
import { Compound } from "@/types/compound";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function analyzePatents(
  compound: Compound,
  patents: Patent[],
  target?: string,
  disease?: string
): Promise<Patent[]> {

  const prompt = `
You are an expert pharmaceutical patent analyst.

Your task is to objectively evaluate candidate patents for their relevance to the submitted compound.
Be conservative while assigning numerical scores.
When uncertain because of limited metadata, prefer moderate scores instead of high scores.

IMPORTANT RULES

1. Use ONLY the information provided below.
2. Do NOT invent chemical mechanisms, therapeutic effects, or patent claims.
3. If information is insufficient, explicitly state "Insufficient metadata".
4. Analyze EACH patent independently.
5. Do NOT repeat the same explanation for different patents.
6. Consider:
   - Compound name
   - Synonyms
   - Target
   - Disease
   - Patent title
   - Assignee
   - Publication date
7. Produce different scores only if justified by the metadata.
8. Return ONLY valid JSON.
9. Do NOT include markdown, notes, explanations, or introductory text.

IMPORTANT LANGUAGE RULE

If the patent title or abstract is written in any language other than English:

- Translate it into natural English.
- Do NOT summarize.
- Preserve the technical meaning.
- Use the translated English version while performing the analysis.
- Return the translated abstract in the JSON response.

If it is already in English, return it unchanged.

==================================================
SCORING GUIDELINES
==================================================

Assign scores conservatively.

Relevance Score (0-100)

90-100
Only if the patent is extremely similar to the submitted compound, with strong chemical and therapeutic overlap clearly supported by the metadata.

70-89
Strong relevance with meaningful overlap.

50-69
Moderate relevance. Some overlap exists, but important differences remain.

30-49
Weak relevance. Limited overlap or indirect relationship.

0-29
Little or no meaningful relevance.

Assign precise integer scores.

Avoid rounding to the nearest multiple of 10 or 5.

For example, use scores such as:
63, 71, 78, 84, 87, 92

instead of:
60, 70, 80, 90.

The score should reflect the exact strength of the available metadata.

Do NOT assign scores above 90 unless the metadata strongly justifies it.

--------------------------------------------

Confidence Score (0-100)

90-100
The available metadata strongly supports the assessment.

70-89
Reasonably confident.

40-69
Some uncertainty because metadata is incomplete or ambiguous.

0-39
Insufficient metadata for a reliable assessment.

Confidence should also be a precise integer between 0 and 100.

Use values like:
61, 74, 83, 88, 91

rather than rounded values like:
60, 70, 80, 90.

Avoid assigning both high relevance and high confidence unless clearly justified by the patent metadata.


==================================================
COMPOUND
==================================================

Name:
${compound.name}

Molecular Formula:
${compound.molecularFormula}

Canonical SMILES:
${compound.canonicalSmiles}

Synonyms:
${(compound.synonyms ?? []).slice(0, 10).join(", ")}

Target:
${target || "Not Provided"}

Disease:
${disease || "Not Provided"}

==================================================
PATENTS
==================================================

${patents.slice(0, 3).map((p, i) => `
Patent ${i + 1}

Patent Number:
${p.patentNumber}

Title:
${p.title}

Assignee:
${p.assignee}

Publication Date:
${p.publicationDate}

Abstract:
${(p.abstract ?? "").substring(0, 700)}
`).join("\n")}

==================================================
TASK
==================================================

TASK

For EACH patent evaluate:

1. Chemical relevance.
2. Therapeutic relevance.
3. Novelty concern.
4. Overall relevance.

For the "summary":

- Write 4–6 complete sentences.
- Explain WHY the patent was retrieved.
- Mention whether the submitted compound is explicitly mentioned.
- Explain the chemical similarity.
- Explain the therapeutic similarity.
- Mention any important limitations due to missing metadata.
- Avoid generic statements.
- Make each patent explanation unique.

Return ONLY a JSON array.

Format:

[
{
  "patentNumber":"US1234567",
  "translatedAbstract":"English abstract here",
  "score":92,
  "confidence":90,
  "summary":"Provide a detailed 4–6 sentence explanation describing why this patent was retrieved, what chemical similarity exists, what therapeutic overlap exists, whether the overlap is significant, and how confident the assessment is.",
  "chemicalOverlap":"Explain in one or two sentences whether the patent claims or describes compounds that are chemically similar to the submitted molecule."
  "therapeuticOverlap":"Explain in one or two sentences whether the therapeutic indication, biological target, or application overlaps with the submitted compound.",
  "riskLevel":"Low"
}
]

riskLevel MUST be exactly one of:

- Low
- Medium
- High

The response MUST start with '['
The response MUST end with ']'
Return NOTHING except the JSON array.
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

  const text = response.choices[0].message.content ?? "[]";

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1) {
    throw new Error("No JSON array found in Groq response.");
  }

  const jsonOnly = cleaned.substring(start, end + 1);

  let rankings: any[] = [];

  try {
    rankings = JSON.parse(jsonOnly);
  } catch (error) {

    console.log("========== GROQ RAW RESPONSE ==========");
    console.log(text);
    console.log("========== CLEANED RESPONSE ==========");
    console.log(cleaned);
    console.log("======================================");

    throw new Error("Groq returned an invalid JSON response.");
  }

  const analyzedPatents = patents.slice(0, 3);

  return analyzedPatents.map((patent) => {

    const ai = rankings.find(
      (r: any) =>
        r.patentNumber === patent.patentNumber
    );

    if (!ai) return patent;

    return {

      ...patent,

      // Replace foreign-language abstract with English version
      abstract:
        ai.translatedAbstract?.trim()
          ? ai.translatedAbstract
          : patent.abstract,

      relevanceScore: ai.score,

      confidence: ai.confidence,

      aiExplanation:
        `${ai.summary}

Chemical Overlap: ${ai.chemicalOverlap}

Therapeutic Overlap: ${ai.therapeuticOverlap}

Risk Level: ${ai.riskLevel}`

    };

  });

}