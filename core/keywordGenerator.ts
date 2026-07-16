import { Compound } from "@/types/compound";

export function generateKeywords(
  compound: Compound,
  target?: string,
  disease?: string
): string[] {

  const keywords = new Set<string>();

  // Always use the primary compound name
  if (compound.name?.trim()) {
    keywords.add(compound.name.trim());
  }

  // Add optional biological target
  if (target?.trim()) {
    keywords.add(target.trim());
  }

  // Add optional disease
  if (disease?.trim()) {
    keywords.add(disease.trim());
  }

  const result = [...keywords];

  // Debug logging
  console.log("Compound Name:", compound.name);
  console.log("Search Keywords:", result);

  return result;
}