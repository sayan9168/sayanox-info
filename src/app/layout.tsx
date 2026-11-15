import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Sayanox Info | Collaborative Knowledge Base",
    template: "%s | Sayanox Info",
  },
  description:
    "Sayanox Information — Wikipedia-style collaborative knowledge base for Sayanox language, tools, and ecosystem. Anyone can contribute, admins moderate.",
  keywords: [
    "Sayanox",
    "Sayanox Language",
    "AI Native Programming",
    "Wiki",
    "Knowledge Base",
    "Sayanox Enterprises",
  ],
  authors: [{ name: "Sayanox Community" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sayanox-info.vercel.app",
    siteName: "Sayanox Info",
    title: "Sayanox Info | Collaborative Knowledge Base",
    description:
      "Collaborative Wikipedia-style information hub for Sayanox AI-native language and ecosystem.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} Sayanox Info. Built for the
                  community. Admin moderated contributions.
                </p>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
