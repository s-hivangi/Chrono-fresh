import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { PermissionStatus } from 'expo-notifications';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Lazy-load expo-notifications so it doesn't crash in Expo Go
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getNotifications(): Promise<any | null> {
  if (isExpoGo) return null;
  return import('expo-notifications');
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
  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('produce-reminders', {
      name: 'Produce reminders',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
  return (await notifications.requestPermissionsAsync()).status as PermissionStatus;
}

export async function scheduleProduceReminder(name: string, days?: number | null) {
  const notifications = await getNotifications();
  if (!notifications) return false;

  const status = await notificationStatus();
  if (status !== 'granted') return false;

  const seconds = Math.max(60, Math.round(Math.min(days ?? 1, 1) * 24 * 60 * 60));
  await notifications.scheduleNotificationAsync({
    content: {
      title: `Check your ${name}`,
      body: `Your ${name} should be checked today.`,
    },
    trigger: {
      type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: 'produce-reminders',
    },
  });
  return true;
}
