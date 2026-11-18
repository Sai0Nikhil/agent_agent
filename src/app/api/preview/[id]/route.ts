import { getDashboardPreview } from "@/lib/preview-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const html = getDashboardPreview(id);
  if (!html) {
    return new Response(
      "<!doctype html><html><body style='background:#090b10;color:#e5e7eb;font-family:sans-serif;padding:40px'><h2>Preview expired or not found</h2><p>Run a new Research → Build mission in DiyaPulse A2A to generate a live dashboard.</p></body></html>",
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
