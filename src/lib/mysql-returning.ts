import { eq } from "drizzle-orm";
import { db } from "@/db";

/**
 * MySQL does not support PostgreSQL's `.returning()`.
 * These helpers perform the write and then read the affected row back.
 */
export async function insertAndFetch(table: any, values: any, idColumn: any): Promise<any> {
  const result: any = await db.insert(table).values(values);
  const insertId = Number(
    result?.[0]?.insertId ??
      result?.insertId ??
      (values && typeof values.id !== "undefined" ? values.id : 0),
  );
  if (!insertId) return undefined;
  const rows = await db.select().from(table).where(eq(idColumn, insertId)).limit(1);
  return rows[0];
}

export async function updateAndFetch(
  table: any,
  patch: any,
  idColumn: any,
  id: number,
): Promise<any> {
  await db.update(table).set(patch).where(eq(idColumn, id));
  const rows = await db.select().from(table).where(eq(idColumn, id)).limit(1);
  return rows[0];
}
