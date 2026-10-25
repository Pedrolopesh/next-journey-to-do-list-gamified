import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { patchMe, sendAppEvent } from '@/api/endpoints';
import { queryKeys, showNextPending, useMe } from '@/api/queries';
import { Button } from '@/components/button';
import { ExportDataButton } from '@/components/export-data-button';
import { Pills } from '@/components/pills';
import { ScreenFrame } from '@/components/screen-frame';
import { TextField } from '@/components/text-field';
import { toast } from '@/features/feedback/toast-store';
import { parseNotifyTime } from '@/features/settings/notify-time';
import { syncDailyReminder } from '@/features/settings/reminder';
import { timezoneOptions } from '@/features/settings/timezones';
import { colors, space } from '@/theme';

/** Configurações (RF-38): fuso horário, lembrete, categorias e sobre. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [notify, setNotify] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const apply = async (body: Parameters<typeof patchMe>[0], success: string): Promise<void> => {
    setSaving(true);
    setMessage(null);
    try {
      queryClient.setQueryData(queryKeys.me, await patchMe(body));
      // O "dia" do usuário muda com o fuso: recarrega tudo que depende dele
      void queryClient.invalidateQueries();
      setMessage(success);
      toast.success(success);
    } catch {
      setMessage(t('settings.saveFailed'));
      toast.error(t('settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const notifyValue = notify ?? me?.user.notifyAt ?? '';

  return (
    <ScreenFrame title={t('profile.settings')}>
      <View style={styles.group}>
        <Text style={styles.label}>{t('settings.timezone')}</Text>
        <Text style={styles.hint}>{t('settings.timezoneHint')}</Text>
        <Pills
          scroll
          label={t('settings.timezone')}
          value={me?.user.timezone ?? null}
          onChange={(zone) => {
            void apply({ timezone: zone }, t('settings.saved'));
          }}
          options={timezoneOptions(deviceZone).map((zone) => ({ value: zone, label: zone }))}
        />
      </View>

      <View style={styles.group}>
        <TextField
          label={t('settings.notifyAt')}
          value={notifyValue}
          onChangeText={setNotify}
          keyboardType="numbers-and-punctuation"
          placeholder="08:00"
        />
        <Text style={styles.hint}>{t('settings.notifyHint')}</Text>
        <Button
          label={t('common.save')}
          variant="secondary"
          loading={saving}
          onPress={() => {
            const parsed = parseNotifyTime(notifyValue);
            if (!parsed.ok) {
              setMessage(t('settings.notifyInvalid'));
              toast.error(t('settings.notifyInvalid'));
              return;
            }
            void (async () => {
              await apply({ notifyAt: parsed.value }, t('settings.saved'));
              const allowed = await syncDailyReminder(parsed.value, { askPermission: true });
              if (!allowed) {
                setMessage(t('settings.notifyDenied'));
                toast.error(t('settings.notifyDenied'));
                return;
              }
              if (parsed.value) {
                // Conquista "Hora marcada": o servidor não sabe do lembrete, que é do aparelho
                void sendAppEvent('reminder_enabled')
                  .then(() => showNextPending(queryClient))
                  .catch(() => undefined);
              }
            })();
          }}
        />
      </View>

      {message ? (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <Button
        label={t('settings.categories')}
        variant="secondary"
        onPress={() => {
          router.push('/settings/categories');
        }}
      />
      <Button
        label={t('sessions.title')}
        variant="secondary"
        onPress={() => {
          router.push('/settings/sessions');
        }}
      />
      <Button
        label={t('credits.title')}
        variant="secondary"
        onPress={() => {
          router.push('/settings/credits');
        }}
      />
      <ExportDataButton />
      <Button
        label={t('settings.delete')}
        variant="secondary"
        onPress={() => {
          router.push('/settings/delete-account');
        }}
      />
      <Text style={styles.about}>
        {t('settings.about', {
          name: 'Next Journey',
          version: Constants.expoConfig?.version ?? '',
        })}
      </Text>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[8] },
  label: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  hint: { color: colors.text.muted, fontSize: 12 },
  message: { color: colors.brand.primaryLight, fontSize: 13 },
  about: { color: colors.text.muted, fontSize: 12, textAlign: 'center', marginTop: space[16] },
});
