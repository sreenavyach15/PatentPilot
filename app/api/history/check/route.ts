import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {

  const smiles =
    request.nextUrl.searchParams.get("smiles");

  const target =
    request.nextUrl.searchParams.get("target") ?? "";

  const disease =
    request.nextUrl.searchParams.get("disease") ?? "";

  if (!smiles) {
    return NextResponse.json({
      exists: false,
    });
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("id,created_at")
    .eq("smiles", smiles)
    .eq("target", target)
    .eq("disease", disease)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data || data.length <= 1) {
    return NextResponse.json({
      exists: false,
    });
  }

  // Ignore the latest analysis (the one just created)
  const previous = data[1];

  return NextResponse.json({
    exists: true,
    count: data.length - 1,
    lastAnalyzed: previous.created_at,
    latestId: previous.id,
  });

}