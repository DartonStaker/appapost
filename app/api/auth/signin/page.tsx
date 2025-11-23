import { redirect } from "next/navigation"
import { SignInForm } from "@/components/signin-form"
import { getCurrentUser } from "@/lib/auth"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function SignInPage() {
  try {
    const user = await getCurrentUser()

    if (user) {
      redirect("/dashboard")
    }
  } catch (error) {
    // If there's an error checking session, still show the sign in page
    console.error("Error checking session:", error)
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

