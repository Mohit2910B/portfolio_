import { getCurrentAdmin } from "@/lib/auth";
import { guard, ok, unauthorized } from "@/lib/http";

export async function GET() {
  return guard(async () => {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return unauthorized();
    }
    return ok({ admin });
  });
}
