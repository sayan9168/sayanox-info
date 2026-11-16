"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export default function NewPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [slugError, setSlugError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (title) {
      const generated = normalizeSlug(title);
      setSlug(generated);
      setSlugError("");
    }
  }, [title]);

  const validateSlug = (value: string): boolean => {
    if (value.length < 3 || value.length > 80) {
      setSlugError("Slug must be between 3 and 80 characters");
      return false;
    }
    if (!SLUG_REGEX.test(value)) {
      setSlugError(
        "Slug may only contain lowercase letters, numbers, and single hyphens between words"
      );
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    const normalized = normalizeSlug(value);
    setSlug(normalized);
    if (normalized) validateSlug(normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateSlug(slug)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Do NOT set status client-side. DB trigger forces 'pending' for non-admins.
      const { data, error } = await supabase
        .from("pages")
        .insert({
          title,
          slug,
          content,
          category: category || null,
          tags: tagArray.length > 0 ? tagArray : null,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes("pages_slug_format_check")) {
          setSlugError("Invalid slug format");
          throw new Error("Invalid slug format");
        }
        throw error;
      }

      await supabase.from("page_versions").insert({
        page_id: data.id,
        title,
        content,
        version: data.version,
        author_id: user.id,
        change_summary: "Initial version",
      });

      if (data.status === "published") {
        setMessage("Page published successfully!");
        setTimeout(() => router.push(`/page/${slug}`), 1200);
      } else {
        setMessage(
          "Page submitted for review. An admin will approve it soon."
        );
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (error: any) {
      setMessage(error.message || "Failed to create page");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Page</CardTitle>
          <CardDescription>
            Contribute knowledge to Sayanox Info. Non-admins will go through
            review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sayanox Language Overview"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Slug (URL)</label>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="sayanox-language-overview"
              />
              {slugError ? (
                <p className="text-xs text-destructive">{slugError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Will be: /page/{slug || "your-slug"}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Language, Tools, Tutorial..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Tags (comma separated)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ai, syntax, beginner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content (Markdown) *</label>
              <textarea
                className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# Heading&#10;&#10;Write your content in **Markdown**..."
                required
              />
            </div>

            {message && (
              <p className="text-sm text-center text-muted-foreground">
                {message}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !!slugError}>
                {loading ? "Submitting..." : "Submit Page"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
