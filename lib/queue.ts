import { Queue, Worker, QueueEvents } from "bullmq"
import { Redis } from "@upstash/redis"

const redisUrl = process.env.UPSTASH_REDIS_URL
const redisToken = process.env.UPSTASH_REDIS_TOKEN

// Lazy Redis connection (only initialize when needed)
function getRedisConnection() {
  if (redisUrl && redisToken) {
    try {
      return {
        host: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port) || 6379,
        password: redisToken,
      }
    } catch {
      // Invalid URL, fall back to defaults
    }
  }
  
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  }
}

const connection = getRedisConnection()

/**
 * Posting queue for rate-limited social media posting
 * Lazy initialization to avoid build-time errors
 */
let _postingQueue: Queue | null = null
let _queueEvents: QueueEvents | null = null

export function getPostingQueue(): Queue {
  if (!_postingQueue) {
    _postingQueue = new Queue("posting", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      },
    })
  }
  return _postingQueue
}

export function getQueueEvents(): QueueEvents {
  if (!_queueEvents) {
    _queueEvents = new QueueEvents("posting", { connection: getRedisConnection() })
  }
  return _queueEvents
}

// Export for backward compatibility
export const postingQueue = getPostingQueue()
export const queueEvents = getQueueEvents()

/**
 * Add a post job to the queue with rate limiting
 */
export async function queuePost(
  postId: string,
  platform: string,
  variantId: string,
  scheduledTime?: Date
) {
  const delay = scheduledTime ? scheduledTime.getTime() - Date.now() : 0

  return await postingQueue.add(
    "post",
    {
      postId,
      platform,
      variantId,
    },
    {
      delay: delay > 0 ? delay : 0,
      jobId: `${postId}-${platform}-${Date.now()}`,
    }
  )
}

/**
 * Calculate delay based on rate limits
 * Returns delay in milliseconds to stagger posts
 */
export function calculatePostDelay(platform: string, lastPostTime?: Date): number {
  const rateLimits: Record<string, { perHour: number; perDay: number }> = {
    instagram: { perHour: 25, perDay: 200 },
    facebook: { perHour: 25, perDay: 200 },
    twitter: { perHour: 300, perDay: 50 },
    linkedin: { perHour: 100, perDay: 100 },
    tiktok: { perHour: 10, perDay: 10 },
    pinterest: { perHour: 1000, perDay: 1000 },
  }

  const limits = rateLimits[platform] || { perHour: 10, perDay: 50 }
  const minInterval = (60 * 60 * 1000) / limits.perHour // ms between posts

  if (!lastPostTime) {
    return 0
  }

  const timeSinceLastPost = Date.now() - lastPostTime.getTime()
  if (timeSinceLastPost >= minInterval) {
    return 0
  }

  return minInterval - timeSinceLastPost
}

/**
 * Worker for processing posting jobs
 * This should be run in a separate process (e.g., Vercel Cron or separate worker)
 */
export function createPostingWorker(processJob: (job: any) => Promise<void>) {
  return new Worker(
    "posting",
    async (job) => {
      console.log(`Processing posting job: ${job.id}`, job.data)
      await processJob(job)
    },
    {
      connection,
      concurrency: 1, // Process one post at a time to respect rate limits
    }
  )
}

