import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);

  const categoryCounts: Record<string, number> = {};
  pages?.forEach((p) => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });

  const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Categories</h1>

      {sorted.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sorted.map(([cat, count]) => (
            <Link key={cat} href={`/categories/${encodeURIComponent(cat)}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {count} page{count !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          No categories yet. Create pages with categories to see them here.
        </p>
      )}
    </div>
  );
}
