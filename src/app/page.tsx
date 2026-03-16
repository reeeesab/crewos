import { redirect } from "next/navigation";

// Redirect root to the dashboard layout
export default function RootPage() {
  redirect("/portfolio");
}
