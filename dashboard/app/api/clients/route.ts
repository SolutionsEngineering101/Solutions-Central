import { NextResponse } from "next/server";
import { getMarkdownFiles } from "@/lib/github";

export async function GET() {
  try {
    const files = await getMarkdownFiles("intake/solutions-forms");
    const clients = Array.from(
      new Set(
        files
          .map((f) => f.frontmatter?.client as string | undefined)
          .filter((c): c is string => !!c && c.trim().length > 0)
          .map((c) => c.trim())
      )
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json(clients);
  } catch {
    return NextResponse.json([]);
  }
}
