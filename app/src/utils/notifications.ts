import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as Notifications from 'expo-notifications';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type NotificationModule = typeof Notifications;

async function getNotifications(): Promise<NotificationModule | null> {
  if (isExpoGo) return null;
  return import('expo-notifications');
}

export async function notificationStatus(): Promise<Notifications.PermissionStatus | 'undetermined'> {
  const notifications = await getNotifications();
  if (!notifications) {
    console.warn('[Notifications] Expo Go does not support Android push notifications.');
    return 'undetermined';
  }

  try {
    return (await notifications.getPermissionsAsync()).status;
  } catch (error) {
    console.error('[Notifications] Error fetching status:', error);
    return 'undetermined';
  }
}

export async function requestNotifications() {
  const notifications = await getNotifications();
  if (!notifications) {
    console.warn('[Notifications] Push notifications require a development or production build.');
    return 'undetermined' as const;
  }

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('produce-reminders', {
      name: 'Produce reminders',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  }
  return (await notifications.requestPermissionsAsync()).status;
}

export async function scheduleProduceReminder(name: string, days?: number | null) {
  const notifications = await getNotifications();
  if (!notifications) return false;

  const status = await notificationStatus();
  if (status !== 'granted') return false;
  const seconds = Math.max(60, Math.round(Math.min(days ?? 1, 1) * 24 * 60 * 60));
  await notifications.scheduleNotificationAsync({
    content: { title: `Check your ${name}`, body: `Your ${name} should be checked today.` },
    trigger: { type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'produce-reminders' },
  });
  return true;
}
