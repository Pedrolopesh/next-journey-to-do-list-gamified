import { IconChevronRight } from '@tabler/icons-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { logout } from '@/api/endpoints';
import { useMe } from '@/api/queries';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { TabScreen } from '@/components/tab-screen';
import { useFeedbackStore } from '@/features/feedback/feedback-store';
import { useAction } from '@/features/feedback/use-action';
import { colors, radius, size, space } from '@/theme';

function LinkRow({ label, href }: { label: string; href: Href }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        router.push(href);
      }}
      style={styles.link}
    >
      <Text style={styles.linkText}>{label}</Text>
      <IconChevronRight size={18} color={colors.text.secondary} strokeWidth={1.75} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  const { run, loading: signingOut } = useAction({
    name: 'auth.logout',
    success: t('auth.logoutSuccess'),
    error: () => t('auth.genericError'),
  });

  const signOut = (): Promise<boolean> =>
    run(async () => {
      const { refreshToken, clear } = useSessionStore.getState();
      // Revoga a sessão no servidor (best effort) e limpa o aparelho de qualquer jeito
      if (refreshToken) await logout(refreshToken).catch(() => undefined);
      queryClient.clear();
      useFeedbackStore.getState().clear();
      await clear();
    });

  return (
    <TabScreen title={t('tabs.profile')} debug={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{me?.character?.name ?? me?.user.name ?? ''}</Text>
          {me?.character ? <Text style={styles.title}>{me.character.title}</Text> : null}
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

        <LinkRow label={t('profile.achievements')} href="/achievements" />
        <LinkRow label={t('profile.myStory')} href="/story/timeline" />
        <LinkRow label={t('profile.customize')} href="/settings/character" />
        <LinkRow label={t('profile.settings')} href="/settings" />
        <Button
          label={t('auth.logout')}
          variant="secondary"
          loading={signingOut}
          onPress={() => void signOut()}
        />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[8], paddingBottom: space[40] },
  card: { gap: space[4], paddingVertical: space[16] },
  name: { color: colors.text.primary, fontSize: 20, fontWeight: '600' },
  title: { color: colors.brand.primaryLight, fontSize: 13 },
  stats: { color: colors.text.secondary, fontSize: 13 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: size.touchTarget + 4,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: space[16],
  },
  linkText: { color: colors.text.primary, fontSize: 15 },
});
