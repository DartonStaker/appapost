import { createClient } from "@/lib/supabase/server"

export async function seedSamplePosts(userId: string) {
  const supabase = await createClient()

  const samplePosts = [
    {
      user_id: userId,
      title: "New Summer Collection Launch",
      excerpt: "Check out our latest summer apparel collection featuring vibrant colors and premium fabrics.",
      image_url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800",
      type: "product" as const,
      status: "draft" as const,
    },
    {
      user_id: userId,
      title: "5 Tips for Custom Apparel Design",
      excerpt: "Learn how to create stunning custom apparel designs that stand out from the crowd.",
      image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      type: "blog" as const,
      status: "queued" as const,
    },
    {
      user_id: userId,
      title: "Limited Edition: Premium Cotton Tees",
      excerpt: "Our premium cotton t-shirts are now available in limited quantities. Get yours today!",
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      type: "product" as const,
      status: "posted" as const,
    },
  ]

  const { data, error } = await supabase
    .from("posts")
    .insert(samplePosts)
    .select()

  if (error) {
    console.error("Error seeding posts:", error)
    throw error
  }

  return data
}

