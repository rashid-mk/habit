import { CloudTasksClient } from '@google-cloud/tasks';

const tasksClient = new CloudTasksClient();

export interface ScheduleReminderParams {
  uid: string;
  habitId: string;
  reminderTime: string;
}

export async function scheduleReminder(
  params: ScheduleReminderParams
): Promise<void> {
  try {
    const { uid, habitId, reminderTime } = params;
    const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const location = process.env.FUNCTION_REGION || 'us-central1';
    const queue = 'habit-reminders';

    const parent = tasksClient.queuePath(project!, location, queue);

    // Parse reminder time
    const [hours, minutes] = reminderTime.split(':').map(Number);

    // Calculate next occurrence
    const now = new Date();
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    const taskName = `${parent}/tasks/${uid}-${habitId}`;

    const task = {
      name: taskName,
      httpRequest: {
        httpMethod: 'POST' as const,
        url: `https://${location}-${project}.cloudfunctions.net/sendReminder`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(
          JSON.stringify({
            uid,
            habitId,
            reminderTime,
          })
        ).toString('base64'),
      },
      scheduleTime: {
        seconds: Math.floor(scheduleTime.getTime() / 1000),
      },
    };

    await tasksClient.createTask({ parent, task });
    console.log(`Scheduled reminder for habit ${habitId} at ${reminderTime}`);
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    throw error;
  }
}

export async function rescheduleReminder(
  params: ScheduleReminderParams
): Promise<void> {
  try {
    // Cancel existing task
    await cancelReminder(params.uid, params.habitId);
    
    // Schedule new task
    await scheduleReminder(params);
    console.log(`Rescheduled reminder for habit ${params.habitId}`);
  } catch (error) {
    console.error('Error rescheduling reminder:', error);
    throw error;
  }
}

export async function cancelReminder(
  uid: string,
  habitId: string
): Promise<void> {
  try {
    const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const location = process.env.FUNCTION_REGION || 'us-central1';
    const queue = 'habit-reminders';

    const parent = tasksClient.queuePath(project!, location, queue);
    const taskName = `${parent}/tasks/${uid}-${habitId}`;

    await tasksClient.deleteTask({ name: taskName });
    console.log(`Cancelled reminder for habit ${habitId}`);
  } catch (error) {
    // Task might not exist, which is fine
    if ((error as any).code !== 5) { // NOT_FOUND error code
      console.error('Error cancelling reminder:', error);
    }
  }
}
