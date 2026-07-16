import { Compound } from "@/types/compound";

export function generateKeywords(
  compound: Compound,
  target?: string,
  disease?: string
): string[] {

  const keywords = new Set<string>();

  // Always use the common compound name
  if (compound.name) {
    keywords.add(compound.name);
  }

  // Add ONE useful synonym only if it looks like a proper chemical/drug name
  const usefulSynonym = compound.synonyms.find(
    (s) =>
      /^[A-Za-z0-9\s-]{3,40}$/.test(s) &&
      !/^\d/.test(s) &&
      !s.includes("(") &&
      !s.includes(")") &&
      s.toLowerCase() !== compound.name.toLowerCase()
  );

  if (usefulSynonym) {
    keywords.add(usefulSynonym);
  }

  if (target?.trim()) {
    keywords.add(target.trim());
  }

  if (disease?.trim()) {
    keywords.add(disease.trim());
  }

  return [...keywords];
}