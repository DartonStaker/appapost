import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { redirect } from "next/navigation"
import { SignInForm } from "@/components/signin-form"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to AppaPost</h1>
          <p className="text-muted-foreground">
            Sign in to manage your social media automation
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}

