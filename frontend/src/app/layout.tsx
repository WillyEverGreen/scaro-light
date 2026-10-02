import type { Metadata } from "next";
import { Manrope, Rajdhani } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { Sidebar } from "@/components/sidebar";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Edgecase - Supply Chain Risk Analyser",
  description: "Supply Chain Analyser for Risk and Overconfidence",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${rajdhani.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <div className="edgecase-shell print:block print:h-auto print:overflow-visible">
              <div className="edgecase-atmosphere" aria-hidden="true">
                <div className="edgecase-atmosphere-grid" />
                <div className="edgecase-atmosphere-orb edgecase-atmosphere-orb-a" />
                <div className="edgecase-atmosphere-orb edgecase-atmosphere-orb-b" />
              </div>
              <Sidebar />
              <main className="edgecase-main print:overflow-visible print:h-auto">
                <div className="edgecase-main-inner">{children}</div>
              </main>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
