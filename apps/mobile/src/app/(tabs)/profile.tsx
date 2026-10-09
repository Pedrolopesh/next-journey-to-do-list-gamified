import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { logout } from '@/api/endpoints';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { TabScreen } from '@/components/tab-screen';
import { colors, space } from '@/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  const signOut = async (): Promise<void> => {
    const { refreshToken, clear } = useSessionStore.getState();
    // Revoga a sessão no servidor (best effort) e limpa o aparelho de qualquer jeito
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    queryClient.clear();
    await clear();
  };

  return (
    <TabScreen title={t('tabs.profile')} debug={false}>
      <View style={styles.card}>
        <Text style={styles.name}>{me?.user.name ?? ''}</Text>
        {me ? (
          <Text style={styles.stats}>
            {t('profile.stats', {
              level: me.player.level,
              exp: me.player.expInLevel,
              next: me.player.expForNextLevel,
              coins: me.player.coins,
            })}
          </Text>
        ) : null}
      </View>
      <Button
        label={t('auth.logout')}
        variant="secondary"
        onPress={() => {
          void signOut();
        }}
      />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[4], paddingVertical: space[16] },
  name: { color: colors.text.primary, fontSize: 20, fontWeight: '600' },
  stats: { color: colors.text.secondary, fontSize: 13 },
});
