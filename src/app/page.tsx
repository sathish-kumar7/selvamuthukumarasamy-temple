import { redirect } from "next/navigation";

export default function Home() {
  // The proxy redirects anonymous visitors to /login before this renders.
  redirect("/dashboard");
}
