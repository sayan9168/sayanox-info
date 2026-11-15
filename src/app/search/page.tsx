"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, title, category, tags, updated_at, content")
      .eq("status", "published")
      .or(`title.ilike.%${q}%,content.ilike.%${q}%,category.ilike.%${q}%`)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (!error) {
      setResults(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Search Sayanox Knowledge</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search titles, content, categories..."
            className="pl-10 h-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" className="mt-3" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((page) => (
            <Link key={page.id} href={`/page/${page.slug}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <CardDescription>
                    {page.category && (
                      <span className="mr-2 text-primary">{page.category}</span>
                    )}
                    Updated {new Date(page.updated_at).toLocaleDateString("en-IN")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {page.content.slice(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : query && !loading ? (
        <p className="text-center text-muted-foreground py-12">
          No results found for &quot;{query}&quot;
        </p>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-12 text-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
