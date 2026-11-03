import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, View } from 'react-native';

import { patchMe } from '@/api/endpoints';
import { queryKeys, useMe } from '@/api/queries';
import { Button } from '@/components/button';
import { CharacterPreview } from '@/components/character-preview';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { characterLayers } from '@/features/qg/character-layers';
import { syncDailyReminder } from '@/features/settings/reminder';
import { colors, fontSize, radius, space } from '@/theme';

const logo = require('../../../assets/images/logo-livro.png') as number;

/** Time of the daily reminder when the person turns the notifications on here. */
const DEFAULT_REMINDER = '09:00';

/** "Want reminders?": asks the system permission and saves the choice. Never blocks the app. */
export default function RemindersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const turnOn = useAction({
    name: 'onboarding.remindersOn',
    error: (cause) => describeError(cause, t),
  });
  const decline = useAction({
    name: 'onboarding.remindersOff',
    error: (cause) => describeError(cause, t),
  });

  const enable = async (): Promise<void> => {
    const ok = await turnOn.run(async () => {
      const granted = await syncDailyReminder(DEFAULT_REMINDER, { askPermission: true });
      const updated = await patchMe(
        granted ? { remindersOptIn: true, notifyAt: DEFAULT_REMINDER } : { remindersOptIn: false },
      );
      queryClient.setQueryData(queryKeys.me, updated);
      if (granted) toast.success(t('onboarding.reminders.enabled'));
      else toast.info(t('onboarding.reminders.denied'));
    });
    if (ok) router.push('/goal');
  };

  const skip = async (): Promise<void> => {
    const ok = await decline.run(async () => {
      queryClient.setQueryData(queryKeys.me, await patchMe({ remindersOptIn: false }));
    });
    if (ok) router.push('/goal');
  };

  return (
    <OnboardingScreen
      preview={<CharacterPreview layers={characterLayers(me?.character ?? null)} />}
      title={t('onboarding.reminders.title')}
      subtitle={t('onboarding.reminders.text')}
      footer={
        <>
          <Button
            label={t('onboarding.reminders.turnOn')}
            loading={turnOn.loading}
            onPress={() => void enable()}
          />
          <Button
            label={t('onboarding.reminders.notNow')}
            variant="ghost"
            loading={decline.loading}
            onPress={() => void skip()}
          />
        </>
      }
    >
      <View style={styles.notification} accessibilityRole="summary">
        <View style={styles.logoBox}>
          <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{t('reminder.title')}</Text>
          <Text style={styles.notificationBody}>{t('reminder.body')}</Text>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    padding: space[16],
    borderRadius: radius.card,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  // The book sits smaller inside the rounded square, like an app icon in a real notification
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.base,
  },
  logo: { width: 24, height: 21 },
  notificationText: { flex: 1, gap: space[4] },
  notificationTitle: { color: colors.text.primary, fontSize: fontSize[14], fontWeight: '700' },
  notificationBody: { color: colors.text.secondary, fontSize: fontSize[13] },
});
