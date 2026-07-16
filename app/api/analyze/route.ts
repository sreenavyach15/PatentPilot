import { NextRequest, NextResponse } from "next/server";
import { analyzeMolecule } from "@/core/analysisPipeline";

export async function POST(req: NextRequest) {
  try {
    const { smiles, target, disease } = await req.json();

    if (!smiles) {
      return NextResponse.json(
        { error: "SMILES is required" },
        { status: 400 }
      );
    }

    const result = await analyzeMolecule(
      smiles,
      target,
      disease
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Analyze API Error:", error);

    return NextResponse.json(
      {
        error: error?.message || String(error),
        details: error,
      },
      {
        status: 500,
      }
    );
  }
}