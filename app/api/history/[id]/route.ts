import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (analysisError) {
    return NextResponse.json(
      { error: analysisError.message },
      { status: 500 }
    );
  }

  const { data: patents, error: patentError } = await supabase
    .from("patents")
    .select("*")
    .eq("analysis_id", id);

  if (patentError) {
    return NextResponse.json(
      { error: patentError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    analysis,
    patents,
  });

}