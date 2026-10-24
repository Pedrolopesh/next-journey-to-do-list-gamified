import type { Session } from '@nextjourney/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { revokeAllSessions, revokeSession } from '@/api/endpoints';
import { queryKeys, useSessions } from '@/api/queries';
import { signOutLocally } from '@/auth/sign-out-local';
import { Button } from '@/components/button';
import { ScreenFrame } from '@/components/screen-frame';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';
import { colors, radius, space } from '@/theme';

/** Data e hora curtas, no idioma do aparelho. */
const when = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

/** Aparelhos com a conta aberta: ver, encerrar um ou sair de todos. */
export default function SessionsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: sessions, isError, isLoading, refetch } = useSessions();
  const [endingId, setEndingId] = useState<string | null>(null);

  const end = useAction({
    name: 'sessions.revoke',
    success: t('sessions.ended'),
    error: (cause) => describeError(cause, t),
  });
  const endAll = useAction({
    name: 'sessions.revokeAll',
    success: t('sessions.endedAll'),
    error: (cause) => describeError(cause, t),
  });

  const endOne = (session: Session): void => {
    setEndingId(session.id);
    void end
      .run(async () => {
        await revokeSession(session.id);
        // Encerrar a sessão deste aparelho é o mesmo que sair: volta ao login
        if (session.current) await signOutLocally(queryClient);
      })
      .then((ok) => {
        setEndingId(null);
        if (ok && !session.current) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
        }
      });
  };

  const endEverything = (): void => {
    void endAll.run(async () => {
      await revokeAllSessions();
      await signOutLocally(queryClient);
    });
  };

  return (
    <ScreenFrame title={t('sessions.title')}>
      <Text style={styles.hint}>{t('sessions.hint')}</Text>
      {isError ? (
        <>
          <Text style={styles.hint}>{t('sessions.loadFailed')}</Text>
          <Button
            label={t('sessions.retry')}
            variant="secondary"
            onPress={() => {
              void refetch();
            }}
          />
        </>
      ) : isLoading || sessions === undefined ? (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {t('sessions.loading')}
        </Text>
      ) : (
        <>
          {sessions.length === 0 ? <Text style={styles.hint}>{t('sessions.empty')}</Text> : null}
          {sessions.map((session) => (
            <View key={session.id} style={styles.card}>
              <Text style={styles.name}>
                {session.deviceName}
                {session.current ? ` · ${t('sessions.thisDevice')}` : ''}
              </Text>
              <Text style={styles.meta}>
                {t('sessions.lastUse', { when: when(session.lastUsedAt) })}
              </Text>
              <Text style={styles.meta}>
                {t('sessions.since', { when: when(session.createdAt) })}
              </Text>
              <Button
                label={session.current ? t('sessions.endThis') : t('sessions.end')}
                variant="secondary"
                loading={end.loading && endingId === session.id}
                disabled={end.loading || endAll.loading}
                onPress={() => {
                  endOne(session);
                }}
              />
            </View>
          ))}
          {sessions.length > 0 ? (
            <Button
              label={t('sessions.endAll')}
              variant="danger"
              loading={endAll.loading}
              disabled={end.loading}
              onPress={endEverything}
            />
          ) : null}
        </>
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.text.secondary, fontSize: 13 },
  card: {
    gap: space[4],
    padding: space[12],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.surface,
  },
  name: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.text.muted, fontSize: 12 },
});
