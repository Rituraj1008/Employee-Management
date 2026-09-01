import { getSession } from "@/lib/auth/session";
import { LandingPage } from "@/components/landing/landing-page";

export default async function RootPage() {
  const session = await getSession().catch(() => null);
  return <LandingPage isLoggedIn={!!session} />;
}
