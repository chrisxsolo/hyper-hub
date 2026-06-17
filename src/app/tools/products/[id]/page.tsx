import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import { getViewer } from "@/lib/supabase/server";
import {
  loadNutritionVersions,
  loadOverviewRow,
  loadPriceHistory,
  loadProductImages,
} from "@/lib/products/server";
import ProductDetailClient from "./ProductDetailClient";

const OWNER_EMAIL = "chrissolorzano118@gmail.com";

export const metadata = {
  title: "Product — Hyper Hub",
  description: "Product details, nutrition, price history and value analytics.",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, email } = await getViewer();
  const canEdit = email === OWNER_EMAIL;

  if (!canEdit) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/tools/products" className="inline-flex items-center gap-1.5 text-sm text-readable-soft hover:text-readable-strong transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Products
        </Link>
        <div className="glass rounded-2xl border border-white/10 p-10 text-center">
          <Lock size={28} className="text-readable-faint mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">This database is private</h2>
          <p className="text-sm text-readable-soft mb-6 max-w-sm mx-auto">Sign in to view product details and history.</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 px-4 py-2 text-sm font-medium hover:bg-rose-500/25 transition-colors">
            <Lock size={14} /> Sign in
          </Link>
        </div>
      </div>
    );
  }

  const product = await loadOverviewRow(supabase, id);
  if (!product) notFound();

  const [history, images, nutritionVersions] = await Promise.all([
    loadPriceHistory(supabase, id),
    loadProductImages(supabase, id),
    loadNutritionVersions(supabase, id),
  ]);

  return (
    <ProductDetailClient
      email={email}
      product={product}
      history={history}
      images={images}
      nutritionVersions={nutritionVersions}
    />
  );
}
