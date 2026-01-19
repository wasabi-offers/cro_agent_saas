import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AIChatAssistant from "@/components/AIChatAssistant";

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
    <html lang="en">
      <head>
        {/* Microsoft Clarity */}
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
      </head>
      <body>
        <div className="min-h-screen bg-black">
          <Sidebar />
          <main className="pl-[280px]">{children}</main>
          <AIChatAssistant />
        </div>
      </body>
    </html>
  );
}
