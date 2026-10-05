import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { isValidIsoDate } from "@/lib/dates";
import { getReportExpenses, getReportTransactions, type ReportType } from "@/lib/reports/query";
import { expenseExporters, exporters } from "@/lib/reports/export";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(user.role, "report:view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const format = params.get("format") ?? "csv";
  const includeCancelled = params.get("includeCancelled") === "1";
  const type: ReportType = params.get("type") === "expenses" ? "expenses" : "donations";

  if (!isValidIsoDate(from) || !isValidIsoDate(to) || from > to) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  const range = { type, preset: "custom" as const, from, to };
  let body: Uint8Array | string;
  let extension: string;
  let contentType: string;
  if (type === "expenses") {
    const exporter = expenseExporters[format];
    if (!exporter) return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    body = await exporter.build(await getReportExpenses(range, { includeCancelled }));
    ({ extension, contentType } = exporter);
  } else {
    const exporter = exporters[format];
    if (!exporter) return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    body = await exporter.build(await getReportTransactions(range, { includeCancelled }));
    ({ extension, contentType } = exporter);
  }
  const filename = `${type}_${from}_to_${to}.${extension}`;

  return new NextResponse(body as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
