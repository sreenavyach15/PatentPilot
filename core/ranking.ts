import { Patent } from "@/types/patent";

export function rankPatents(
  patents: Patent[],
  keywords: string[]
): Patent[] {

  return patents
    .map((patent) => {

      let score = 0;

      const title = patent.title.toLowerCase();

      keywords.forEach((keyword) => {

        const words = keyword
          .toLowerCase()
          .split(/[\s,-]+/)
          .filter(w => w.length > 2);

        words.forEach(word => {

          if (title.includes(word)) {
            score += 10;
          }

        });

      });

      patent.relevanceScore = Math.min(score, 100);
      patent.confidence = Math.min(score + 15, 100);

      return patent;

    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

}