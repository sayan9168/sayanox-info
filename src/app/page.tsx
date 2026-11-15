import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Users, Shield, Sparkles } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: recentPages } = await supabase
    .from("pages")
    .select("id, slug, title, category, updated_at, tags")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(6);

  const { data: categories } = await supabase
    .from("pages")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);

  const uniqueCategories = [
    ...new Set(categories?.map((c) => c.category).filter(Boolean) || []),
  ];

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-12 text-center">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Collaborative Knowledge Base
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Sayanox{" "}
            <span className="text-primary">Info</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Wikipedia-style knowledge hub for the Sayanox AI-native programming
            language, tools, ecosystem & community. Everyone can contribute.
            Admins moderate.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/search">
                <Search className="mr-2 h-4 w-4" /> Explore Knowledge
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/new">
                <BookOpen className="mr-2 h-4 w-4" /> Contribute
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Public Contributions</CardTitle>
            <CardDescription>
              Anyone can propose edits or create new pages. Login required for
              contributions.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Admin Moderated</CardTitle>
            <CardDescription>
              All contributions go through review. Quality & accuracy maintained
              by trusted admins.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Search className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Full Index & Search</CardTitle>
            <CardDescription>
              Every page is indexed. Powerful search across titles, content,
              categories & tags.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Updates</h2>
          <Button variant="ghost" asChild>
            <Link href="/recent">View all</Link>
          </Button>
        </div>
        {recentPages && recentPages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentPages.map((page) => (
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
                      Updated{" "}
                      {new Date(page.updated_at).toLocaleDateString("en-IN")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No pages yet. Be the first to contribute knowledge about Sayanox!
              <div className="mt-4">
                <Button asChild>
                  <Link href="/new">Create First Page</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {uniqueCategories.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((cat) => (
              <Button key={cat} variant="secondary" asChild>
                <Link href={`/categories/${encodeURIComponent(cat!)}`}>
                  {cat}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
