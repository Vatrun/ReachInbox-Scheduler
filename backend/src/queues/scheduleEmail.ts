import { emailQueue } from "./emailQueue";

interface ScheduleEmailParams {
  emailId: number;
  scheduledTime: Date;
}

// auto-generated job id on purpose, so it never collides with an old completed job
export async function scheduleEmailJob({
  emailId,
  scheduledTime,
}: ScheduleEmailParams): Promise<string> {
  const delayMs = Math.max(0, scheduledTime.getTime() - Date.now());

  const job = await emailQueue.add("send-email", { emailId }, { delay: delayMs });

  return job.id as string;
}