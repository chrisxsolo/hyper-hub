import { type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthContext, jsonError, jsonOk, requestId } from "@/lib/owner";
import { loadNutritionVersions, loadOverviewRow } from "@/lib/products/server";

const idSchema = z.string().uuid();

// PATCH — make an existing nutrition version the current one (version history).
export async function PATCH(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string; versionId: string }> },
) {
  const rid = requestId();
  const { supabase, isOwner } = await getAuthContext();
  if (!isOwner) return jsonError(401, "Sign in to edit nutrition.", rid);

  const { id, versionId } = await ctx.params;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(versionId).success) {
    return jsonError(400, "Invalid id.", rid);
  }

  const { error } = await supabase.rpc("costco_set_current_nutrition_version", {
    p_product_id: id,
    p_version_id: versionId,
  });
  if (error) return jsonError(500, error.message, rid);

  // Keep the food-library link pointed at the now-current version.
  await supabase
    .from("food_library_items")
    .update({ nutrition_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("product_id", id);

  const [overview, versions] = await Promise.all([
    loadOverviewRow(supabase, id),
    loadNutritionVersions(supabase, id),
  ]);
  return jsonOk({ product: overview, versions }, rid);
}
