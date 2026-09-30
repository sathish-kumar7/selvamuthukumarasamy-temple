import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { isValidIsoDate } from "@/lib/dates";
import { getReportTransactions } from "@/lib/reports/query";
import { exporters } from "@/lib/reports/export";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(user.role, "report:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const format = params.get("format") ?? "csv";
  const includeCancelled = params.get("includeCancelled") === "1";

  if (!isValidIsoDate(from) || !isValidIsoDate(to) || from > to) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  const exporter = exporters[format];
  if (!exporter) return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  const rows = await getReportTransactions({ preset: "custom", from, to }, { includeCancelled });
  const body = await exporter.build(rows);
  const filename = `donations_${from}_to_${to}.${exporter.extension}`;

  return new NextResponse(body as BodyInit, {
    headers: {
      "Content-Type": exporter.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
