import { getCurrentAdmin } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const admin = await getCurrentAdmin();
    return ok({ admin });
  });
}
