import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PermissionStatus } from 'expo-notifications';

const REMINDER_STORAGE_KEY = '@chronofresh/produce-reminders';

type ReminderIds = Record<string, string>;
export type ProduceReminder = {
  productId: number;
  name: string;
  dueAt?: string | null;
  stage?: string | null;
};

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Lazy-load the native module so an unsupported runtime degrades gracefully.
// This project disables notification scheduling in Expo Go; local reminders
// require a development or production build on the current Android setup.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getNotifications(): Promise<any | null> {
  if (isExpoGo) {
    return null;
  }
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureReminderChannel(notifications: any) {
  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('produce-reminders', {
      name: 'Produce reminders',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function notificationStatus(): Promise<PermissionStatus | 'undetermined'> {
  const notifications = await getNotifications();
  if (!notifications) {
    return 'undetermined';
  }
  try {
    return (await notifications.getPermissionsAsync()).status as PermissionStatus;
  } catch {
    return 'undetermined';
  }
}

export async function requestNotifications(): Promise<PermissionStatus | 'undetermined'> {
  const notifications = await getNotifications();
  if (!notifications) {
    return 'undetermined';
  }
  await ensureReminderChannel(notifications);
  return (await notifications.requestPermissionsAsync()).status as PermissionStatus;
}

async function savedReminderIds(): Promise<ReminderIds> {
  try {
    return JSON.parse((await AsyncStorage.getItem(REMINDER_STORAGE_KEY)) ?? '{}') as ReminderIds;
  } catch {
    return {};
  }
}

async function saveReminderIds(reminders: ReminderIds) {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
}

/** Cancel a previously scheduled native reminder for one produce item. */
export async function cancelProduceReminder(productId: number) {
  const notifications = await getNotifications();
  const reminders = await savedReminderIds();
  const identifier = reminders[String(productId)];
  if (!identifier) return false;

  try {
    if (notifications) await notifications.cancelScheduledNotificationAsync(identifier);
  } finally {
    delete reminders[String(productId)];
    await saveReminderIds(reminders).catch(() => undefined);
  }
  return true;
}

/** Remove reminder identifiers and cancel scheduled alerts when an account signs out. */
export async function clearProduceReminders() {
  const reminders = await savedReminderIds();
  const notifications = await getNotifications();
  if (notifications) {
    await Promise.allSettled(Object.values(reminders).map((identifier) =>
      notifications.cancelScheduledNotificationAsync(identifier)));
  }
  await AsyncStorage.removeItem(REMINDER_STORAGE_KEY).catch(() => undefined);
}

/**
 * Schedule one exact recheck reminder for a saved scan.
 *
 * A rescan replaces the old reminder. If the estimate has already elapsed,
 * the Alerts tab surfaces it immediately instead of creating a surprise
 * notification for an old result.
 */
export async function scheduleProduceReminder(reminder: ProduceReminder) {
  const dueAt = reminder.dueAt ? new Date(reminder.dueAt) : null;
  if (!dueAt || Number.isNaN(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
    await cancelProduceReminder(reminder.productId);
    return false;
  }

  const notifications = await getNotifications();
  if (!notifications) return false;

  const status = await notificationStatus();
  if (status !== 'granted') return false;

  await ensureReminderChannel(notifications);
  await cancelProduceReminder(reminder.productId);
  const identifier = await notifications.scheduleNotificationAsync({
    content: {
      title: `Time to check ${reminder.name}`,
      body: `Its estimated ${reminder.stage ?? 'current'} shelf-life window has ended. Rescan to confirm its next stage.`,
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
      channelId: 'produce-reminders',
    },
  });

  const reminders = await savedReminderIds();
  reminders[String(reminder.productId)] = identifier;
  await saveReminderIds(reminders);
  return true;
}
