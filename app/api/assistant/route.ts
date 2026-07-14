import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getShoppingAssistant } from "@/lib/assistant";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(500),
  context: z.object({
    lastSearch: z.string().trim().min(1).max(500).optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_048) {
    return NextResponse.json({ error: "La consulta es demasiado extensa." }, { status: 413 });
  }

  const rateLimit = await checkRateLimit("shopping-assistant", {
    limit: 30,
    windowMs: 10 * 60 * 1_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Alcanzaste el limite de consultas. Intenta nuevamente en unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter ?? 60) },
      },
    );
  }

  const payload = requestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "La consulta no es valida." }, { status: 400 });
  }

  try {
    const session = await auth();
    const assistant = getShoppingAssistant();
    const reply = await assistant.respond({
      ...payload.data,
      userId: session?.user?.id,
    });
    return NextResponse.json(reply);
  } catch (error) {
    console.error("Shopping assistant error", error);
    return NextResponse.json(
      { error: "No pude consultar el catalogo en este momento." },
      { status: 500 },
    );
  }
}
