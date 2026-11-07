import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '@/i18n';

import { splitTime } from './notify-time';

const CHANNEL_ID = 'daily-reminder';

/**
 * Schedules (or cancels) the local daily reminder. The permission is only asked here, when the person
 * picks a time, never on app open. Returns false if the permission was denied.
 * The time applies to the device clock.
 */
export async function syncDailyReminder(
  notifyAt: string | null,
  options: { askPermission: boolean },
): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!notifyAt) return true;

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted && options.askPermission) {
    ({ granted } = await Notifications.requestPermissionsAsync());
  }
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: i18n.t('reminder.channel'),
      importance: AndroidImportance.DEFAULT,
    });
  }
  const { hour, minute } = splitTime(notifyAt);
  await Notifications.scheduleNotificationAsync({
    content: { title: i18n.t('reminder.title'), body: i18n.t('reminder.body') },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
  return true;
}
