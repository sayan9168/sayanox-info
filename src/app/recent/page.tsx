import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RecentPage() {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, title, category, updated_at, tags")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(30);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Recent Updates</h1>

      {pages && pages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link key={page.id} href={`/page/${page.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{page.title}</CardTitle>
                  <CardDescription>
                    {page.category && (
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary mr-2">
                        {page.category}
                      </span>
                    )}
                    {new Date(page.updated_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          No published pages yet.
        </p>
      )}
    </div>
  );
}
