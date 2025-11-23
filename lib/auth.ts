import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    name: profile?.full_name || user.email!,
    image: profile?.avatar_url || null,
  }
}
