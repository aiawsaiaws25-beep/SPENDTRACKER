import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create Account — SpendWise",
  description: "Create a new SpendWise account and choose your currency.",
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return <SignupForm />;
}
