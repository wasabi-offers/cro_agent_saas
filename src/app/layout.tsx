import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AuthLayout from "@/components/AuthLayout";
import ThemeProvider from "@/components/ThemeProvider";
import LanguageProvider from "@/components/LanguageProvider";

export const metadata: Metadata = {
  title: "CRO Agent - Conversion Rate Optimization",
  description: "AI-powered CRO insights from Clarity, Crazy Egg, and Google Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {clarityProjectId && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityProjectId}");
              `,
            }}
          />
        )}
        <Script
          data-website-id="dfid_3xAOfHpWfK9xSEcQ4Q4ne"
          data-domain="cro-agent.vercel.app"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthLayout>{children}</AuthLayout>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
