import { NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase"

export async function GET() {
  try {
    const { error } = await supabase
      .from("alunos")
      .select("id")
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      message: "Supabase ativo",
      time: new Date()
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err
    })
  }
}