import { IconCoin } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { chapterProgress, useMe } from '@/api/queries';
import { colors, space } from '@/theme';

/**
 * Resumo do avanço que aparece colado ao banner quando o cartão do capítulo rola para fora da
 * tela: barra fina do capítulo e, embaixo, moedas e EXP.
 */
export function ProgressMiniBar() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  if (!me) return null;
  const { player } = me;
  const ratio = player.story.completed ? 1 : chapterProgress(me);
  return (
    <View
      style={styles.bar}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${t('progress.coins', { count: player.coins })}. ${t('progress.exp', { exp: player.expInLevel, next: player.expForNextLevel })}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <View style={styles.foot}>
        <View style={styles.coins}>
          <IconCoin size={14} color={colors.brand.gold} strokeWidth={1.75} />
          <Text style={styles.coinsText}>{player.coins}</Text>
        </View>
        <Text style={styles.exp}>
          {t('progress.exp', { exp: player.expInLevel, next: player.expForNextLevel })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: space[4],
    paddingVertical: space[8],
    paddingHorizontal: space.screenMargin,
    backgroundColor: colors.bg.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.strong,
  },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.bg.sunken, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.brand.primary },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coins: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  coinsText: { color: colors.brand.gold, fontSize: 13, fontWeight: '700' },
  exp: { color: colors.text.muted, fontSize: 12 },
});
