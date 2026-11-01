import { analyzeReport } from "@/lib/ai/analyze";
import { errorResponse } from "@/lib/errors";
import { analyzeLimiter, clientKey } from "@/lib/rate-limit";
import { validateUpload } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    analyzeLimiter.check(clientKey(req));
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    const upload = await validateUpload(file instanceof File ? file : null);
    const analysis = await analyzeReport(upload);
    return Response.json({ analysis });
  } catch (err) {
    return errorResponse(err);
  }
}
