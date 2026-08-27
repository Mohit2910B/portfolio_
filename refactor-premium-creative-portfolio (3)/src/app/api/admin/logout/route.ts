import { destroySession } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  return guard(async () => {
    await destroySession();
    return ok({ ok: true });
  });
}
