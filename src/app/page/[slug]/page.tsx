import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Clock, Tag, Folder } from "lucide-react";
import { format } from "date-fns";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("title, content")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!page) return { title: "Page not found" };

  return {
    title: page.title,
    description: page.content.slice(0, 160),
  };
}

export default async function WikiPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !page) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-8">
      <article>
        <header className="mb-8 border-b pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {page.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {page.category && (
                  <span className="inline-flex items-center gap-1">
                    <Folder className="h-4 w-4" />
                    {page.category}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Updated {format(new Date(page.updated_at), "dd MMM yyyy")}
                </span>
                <span>v{page.version}</span>
              </div>
              {page.tags && page.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {page.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/page/${slug}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          </div>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {page.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
