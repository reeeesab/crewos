import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0c0d0f", gap: "24px" }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#5b7fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="white">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 600, color: "white" }}>SaaSForge</span>
      </div>

      <SignUp
        appearance={{
          baseTheme: undefined,
          variables: {
            colorBackground: "#1b1d20",
            colorInputBackground: "#252729",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "#d1d5db",
            colorTextOnPrimaryBackground: "#ffffff",
            colorPrimary: "#5b7fff",
            colorDanger: "#ef4444",
            colorSuccess: "#4ade80",
            colorNeutral: "#ffffff",
            borderRadius: "8px",
            fontSize: "14px",
          },
          elements: {
            card: {
              backgroundColor: "#1b1d20",
              border: "1px solid #2a2d31",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            },
            headerTitle: { color: "#ffffff", fontWeight: "600" },
            headerSubtitle: { color: "#9ca3af" },
            socialButtonsBlockButton: {
              backgroundColor: "#252729",
              border: "1px solid #2a2d31",
              color: "#ffffff",
            },
            socialButtonsBlockButtonText: { color: "#ffffff", fontWeight: "500" },
            dividerLine: { backgroundColor: "#2a2d31" },
            dividerText: { color: "#9ca3af", backgroundColor: "#1b1d20" },
            formFieldLabel: { color: "#ffffff", fontWeight: "600", marginBottom: "4px" },
            formFieldInput: {
              backgroundColor: "#252729",
              borderColor: "#2a2d31",
              color: "#ffffff",
            },
            formButtonPrimary: {
              backgroundColor: "#5b7fff",
              color: "#ffffff",
              fontWeight: "600",
            },
            footerActionText: { color: "#9ca3af" },
            footerActionLink: { color: "#5b7fff", fontWeight: "600" },
            identityPreviewText: { color: "#ffffff" },
            identityPreviewEditButtonIcon: { color: "#5b7fff" },
            formFieldSuccessText: { color: "#4ade80", fontWeight: "500" },
            formFieldErrorText: { color: "#f87171" },
            formFieldInfoText: { color: "#d1d5db" },
            formFieldHintText: { color: "#9ca3af" },
            alertText: { color: "#ffffff" },
            formFieldInputShowPasswordIcon: { color: "#9ca3af" },
          },
        }}
      />
    </div>
  );
}
