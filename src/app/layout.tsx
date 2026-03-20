import type { Metadata } from "next";
import { DM_Serif_Display, JetBrains_Mono, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/provider";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indiqo — Portfolio Management OS",
  description:
    "The command center for indie SaaS founders. Manage revenue, costs, roadmap, and more from one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#06b6d4",
          colorBackground: "#0d1117",
          colorInputBackground: "#1e2938",
          colorInputText: "#f1f5f9",
          colorText: "#f1f5f9",
          colorTextSecondary: "#94a3b8",
          colorTextOnPrimaryBackground: "#0d1117",
          colorDanger: "#ef4444",
          colorSuccess: "#10b981",
          borderRadius: "10px",
          fontFamily: "var(--font-inter)",
        },
        elements: {
          rootBox: { width: "100%" },
          cardBox: { width: "100%" },
          card: {
            backgroundColor: "#131b2e",
            border: "1px solid #1e2938",
            boxShadow: "0 28px 70px rgba(0, 0, 0, 0.48)",
            backdropFilter: "blur(14px)",
          },
          headerTitle: { color: "#f0f4ff", fontWeight: "700", letterSpacing: "-0.01em" },
          headerSubtitle: { color: "#8892a4" },
          socialButtonsBlockButton: {
            backgroundColor: "#1e2938",
            border: "1px solid #1e2938",
            color: "#f1f5f9",
          },
          socialButtonsBlockButtonText: { color: "#f1f5f9", fontWeight: "600" },
          dividerLine: { backgroundColor: "#1e2938" },
          dividerText: { color: "#94a3b8", backgroundColor: "#131b2e" },
          formFieldLabel: { color: "#f1f5f9", fontWeight: "600" },
          formFieldInput: {
            backgroundColor: "#1e2938",
            borderColor: "#1e2938",
            color: "#f1f5f9",
          },
          formButtonPrimary: {
            backgroundColor: "#06b6d4",
            color: "#0d1117",
            fontWeight: "700",
          },
          footerActionText: { color: "#94a3b8" },
          footerActionLink: { color: "#06b6d4", fontWeight: "700" },
          formFieldInputShowPasswordIcon: { color: "#8892a4" },
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${inter.variable} ${jetBrainsMono.variable} ${dmSerifDisplay.variable} antialiased`}>
          <TRPCProvider>{children}</TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
