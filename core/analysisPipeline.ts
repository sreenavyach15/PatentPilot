import { getCompound } from "@/services/pubchem";
import { searchPatents } from "@/services/patentSearch";
import { analyzePatents } from "@/services/groq";
import { generateKeywords } from "./keywordGenerator";
import { generateReport } from "@/services/report";
import { saveAnalysis } from "@/services/history";

export async function analyzeMolecule(
  smiles: string,
  target?: string,
  disease?: string
) {

  const compound = await getCompound(smiles);

  const keywords = generateKeywords(
    compound,
    target,
    disease
  );

  console.log("Search Keywords:", keywords);
  console.log("Search Query:", keywords.join(" "));

  const patents = await searchPatents(
    keywords.join(" ")
  );

  const rankedPatents = await analyzePatents(
    compound,
    patents,
    target,
    disease
  );

  rankedPatents.sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  const report = await generateReport(
    compound,
    rankedPatents
  );

  await saveAnalysis(
    smiles,
    target,
    disease,
    compound,
    rankedPatents,
    report
  );

  return {
    compound,
    patents: rankedPatents,
    report,
  };
}