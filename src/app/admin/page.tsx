"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Eye } from "lucide-react";

export default function AdminPage() {
  const [pendingPages, setPendingPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "moderator") {
        setMessage("Access denied. Admin or Moderator only.");
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data: pages } = await supabase
        .from("pages")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setPendingPages(pages || []);
      setLoading(false);
    };

    checkAndLoad();
  }, []);

  const handleAction = async (pageId: string, action: "published" | "rejected") => {
    const { error } = await supabase
      .from("pages")
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq("id", pageId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPendingPages((prev) => prev.filter((p) => p.id !== pageId));
    setMessage(action === "published" ? "Page approved and published!" : "Page rejected.");
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-12 text-center">
        <p className="text-destructive">{message || "Access denied"}</p>
        <Button asChild className="mt-4">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Review and moderate community contributions
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-md bg-muted p-3 text-sm text-center">
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews ({pendingPages.length})</CardTitle>
          <CardDescription>
            These pages are waiting for approval before going live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No pending contributions. Great job!
            </p>
          ) : (
            <div className="space-y-4">
              {pendingPages.map((page) => (
                <div
                  key={page.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      /{page.slug} • {page.category || "No category"} •{" "}
                      {new Date(page.created_at).toLocaleDateString("en-IN")}
                    </p>
                    <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">
                      {page.content.slice(0, 150)}...
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/page/${page.slug}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAction(page.id, "published")}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(page.id, "rejected")}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
