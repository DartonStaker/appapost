import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { scheduledPosts, posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function SchedulePage() {
  const user = await getCurrentUser()
  if (!user) return null

  const scheduled = await db
    .select({
      scheduledPost: scheduledPosts,
      post: posts,
    })
    .from(scheduledPosts)
    .leftJoin(posts, eq(scheduledPosts.postId, posts.id))
    .where(eq(scheduledPosts.status, "scheduled"))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your scheduled posts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>
            Your scheduled social media posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduled.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled posts</p>
          ) : (
            <div className="space-y-4">
              {scheduled.map((item) => (
                <div
                  key={item.scheduledPost.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.post?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.scheduledPost.scheduledFor).toLocaleString()} • {item.scheduledPost.platform}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize">{item.scheduledPost.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
  format: (date: Date, formatStr: string) => format(date, formatStr),
  startOfWeek: (date: Date) => date,
  endOfWeek: (date: Date) => date,
  startOfDay: (date: Date) => date,
  endOfDay: (date: Date) => date,
  addDays: (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000),
  addWeeks: (date: Date, weeks: number) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000),
  addMonths: (date: Date, months: number) => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + months)
    return newDate
  },
  subtractDays: (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000),
  subtractWeeks: (date: Date, weeks: number) => new Date(date.getTime() - weeks * 7 * 24 * 60 * 60 * 1000),
  subtractMonths: (date: Date, months: number) => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() - months)
    return newDate
  },
  isSameDay: (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  },
  isSameMonth: (date1: Date, date2: Date) => {
    return date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear()
  },
  isSameYear: (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear()
  },
  isBefore: (date1: Date, date2: Date) => date1 < date2,
  isAfter: (date1: Date, date2: Date) => date1 > date2,
  isEqual: (date1: Date, date2: Date) => date1.getTime() === date2.getTime(),
  diff: (date1: Date, date2: Date, unit: string) => {
    const diff = date1.getTime() - date2.getTime()
    if (unit === "days") return Math.floor(diff / (24 * 60 * 60 * 1000))
    if (unit === "weeks") return Math.floor(diff / (7 * 24 * 60 * 60 * 1000))
    if (unit === "months") {
      const years = date1.getFullYear() - date2.getFullYear()
      const months = date1.getMonth() - date2.getMonth()
      return years * 12 + months
    }
    return diff
  },
  startOf: (date: Date, unit: string) => {
    const newDate = new Date(date)
    if (unit === "month") {
      newDate.setDate(1)
      newDate.setHours(0, 0, 0, 0)
    } else if (unit === "week") {
      const day = newDate.getDay()
      const diff = newDate.getDate() - day
      newDate.setDate(diff)
      newDate.setHours(0, 0, 0, 0)
    } else if (unit === "day") {
      newDate.setHours(0, 0, 0, 0)
    }
    return newDate
  },
  endOf: (date: Date, unit: string) => {
    const newDate = new Date(date)
    if (unit === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
      newDate.setDate(0)
      newDate.setHours(23, 59, 59, 999)
    } else if (unit === "week") {
      const day = newDate.getDay()
      const diff = 6 - day
      newDate.setDate(newDate.getDate() + diff)
      newDate.setHours(23, 59, 59, 999)
    } else if (unit === "day") {
      newDate.setHours(23, 59, 59, 999)
    }
    return newDate
  },
}

