import type { Metadata } from "next";
import { DM_Serif_Display, JetBrains_Mono, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/lib/trpc/provider";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const geistUI = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrewOS — Portfolio Management OS",
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
          colorPrimary: "#00d4ff",
          colorBackground: "#0d1117",
          colorInputBackground: "rgba(255, 255, 255, 0.03)",
          colorInputText: "#f0f4ff",
          colorText: "#f0f4ff",
          colorTextSecondary: "#8892a4",
          colorTextOnPrimaryBackground: "#080b12",
          colorDanger: "#f43f5e",
          colorSuccess: "#10b981",
          borderRadius: "12px",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          rootBox: { width: "100%" },
          cardBox: { width: "100%" },
          card: {
            backgroundColor: "rgba(19, 25, 32, 0.82)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 28px 70px rgba(0, 0, 0, 0.48)",
            backdropFilter: "blur(14px)",
          },
          headerTitle: { color: "#f0f4ff", fontWeight: "700", letterSpacing: "-0.01em" },
          headerSubtitle: { color: "#8892a4" },
          socialButtonsBlockButton: {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#f0f4ff",
          },
          socialButtonsBlockButtonText: { color: "#f0f4ff", fontWeight: "600" },
          dividerLine: { backgroundColor: "rgba(255, 255, 255, 0.12)" },
          dividerText: { color: "#8892a4", backgroundColor: "rgba(19, 25, 32, 0.82)" },
          formFieldLabel: { color: "#f0f4ff", fontWeight: "600" },
          formFieldInput: {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            color: "#f0f4ff",
          },
          formButtonPrimary: {
            backgroundColor: "#00d4ff",
            color: "#080b12",
            fontWeight: "700",
          },
          footerActionText: { color: "#8892a4" },
          footerActionLink: { color: "#00d4ff", fontWeight: "700" },
          formFieldInputShowPasswordIcon: { color: "#8892a4" },
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${geistUI.variable} ${jetBrainsMono.variable} ${dmSerifDisplay.variable} antialiased`}>
          <TRPCProvider>{children}</TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
