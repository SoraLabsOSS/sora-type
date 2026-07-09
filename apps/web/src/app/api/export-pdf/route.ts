import { buildFontReport, exportReportAsPdf } from "@sora-type/font-engine";
import { create as createFont } from "fontkit";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

// pdfkit generates via Node streams/buffers and has no zero-config browser
// build (unlike fontkit/harfbuzzjs) — this is the one piece of the engine
// that needs a server-side route rather than running client-side.
export const runtime = "nodejs";

const MAX_FONT_SIZE = 10 * 1024 * 1024;
const FILE_EXTENSION = /\.[^./]+$/;

const RATE_LIMIT = 15;
const RATE_LIMIT_WINDOW = "60 s";

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    // No IP header (shouldn't happen behind Vercel's edge in production):
    // give each such request its own bucket instead of lumping unrelated
    // clients into a single shared "unknown" identifier.
    `unknown:${crypto.randomUUID()}`
  );
}

function tooManyRequests(reset: number): NextResponse {
  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request: Request): Promise<Response> {
  const rateLimit = await checkRateLimit(`export-pdf:${getClientIp(request)}`, {
    limit: RATE_LIMIT,
    window: RATE_LIMIT_WINDOW,
  });
  if (!rateLimit.success) {
    return tooManyRequests(rateLimit.reset);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data body with a 'font' file field" },
      { status: 400 }
    );
  }

  const file = formData.get("font");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'font' file field" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FONT_SIZE) {
    return NextResponse.json(
      { error: `Font file exceeds ${MAX_FONT_SIZE / (1024 * 1024)}MB limit` },
      { status: 413 }
    );
  }

  const modeParam = formData.get("mode");
  const mode = modeParam === "detected" ? "detected" : "all";

  const arrayBuffer = await file.arrayBuffer();

  let font: ReturnType<typeof createFont>;
  try {
    const opened = createFont(Buffer.from(arrayBuffer));
    font = "fonts" in opened ? opened.fonts[0] : opened;
  } catch (err) {
    return NextResponse.json(
      { error: `Could not parse font: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const report = buildFontReport(font, arrayBuffer, file.name, mode, file.size);
  const pdfBytes = await exportReportAsPdf(report);
  const pdfArrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;
  const downloadName = `${file.name.replace(FILE_EXTENSION, "")}-report.pdf`;

  return new Response(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
    },
  });
}
