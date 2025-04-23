import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RAM Compiler",
  description: "A web-based Random Access Machine compiler and interpreter",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en"　suppressHydrationWarning　>
      <body className={inter.className}>
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RAM Compiler" />
        <meta property="og:description" content="A web-based Random Access Machine compiler and interpreter" />
        <meta property="og:url" content="https://ram-compile-editor.vercel.app/" />
        <meta property="og:site_name" content="RAM Compiler" />
        <meta property="og:image" content="https://ram-compile-editor.vercel.app/opengraph-image.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="twitter:title" content="RAM Compiler" />
        <meta property="twitter:description" content="A web-based Random Access Machine compiler and interpreter" />
        <meta property="twitter:image" content="https://ram-compile-editor.vercel.app/twitter-image.png" />
        <meta name="twitter:card" content="A web-based Random Access Machine compiler and interpreter" />
        <meta name="twitter:site" content="@Tomas_engineer" />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
