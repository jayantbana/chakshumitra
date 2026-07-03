// src/app/(workspace)/app/page.tsx
import { redirect } from "next/navigation";

export default function AppPage() {
  redirect("/app/chat");
}