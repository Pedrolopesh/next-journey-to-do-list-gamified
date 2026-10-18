import { IconX } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import { colors, mix, radius, rgba, space } from '@/theme';

import { Button } from './button';
import { Insignia } from './pixel-art';

type Props = {
  visible: boolean;
  name: string;
  /** Critério da conquista (opcional: some quando o catálogo ainda não foi carregado). */
  description?: string | undefined;
  /** Insígnia (nome em `@nextjourney/insignias`). */
  glyph: string;
  /** Cor da moldura (classe) conquistada: pinta o topo do modal. */
  tierColor: string;
  onContinue: () => void;
  onSeeAll: () => void;
};

const HEADER_HEIGHT = 270;
const RAYS = 14;

/** Raios do brilho atrás da insígnia (triângulos alternados, centro em cx, cy). */
function rays(cx: number, cy: number): string[] {
  const out: string[] = [];
  const step = (Math.PI * 2) / RAYS;
  for (let i = 0; i < RAYS; i += 2) {
    const a = i * step;
    const b = a + step;
    const far = 420;
    out.push(
      `${cx},${cy} ${Math.round(cx + Math.cos(a) * far)},${Math.round(cy + Math.sin(a) * far)} ${Math.round(cx + Math.cos(b) * far)},${Math.round(cy + Math.sin(b) * far)}`,
    );
  }
  return out;
}

/** Brilho de quatro pontas (estrelinha) em volta da insígnia. */
function sparkle(x: number, y: number, r: number): string {
  const t = r * 0.18;
  return `M${x} ${y - r} L${x + t} ${y - t} L${x + r} ${y} L${x + t} ${y + t} L${x} ${y + r} L${x - t} ${y + t} L${x - r} ${y} L${x - t} ${y - t} Z`;
}

/**
 * Alerta de conquista nova: o mesmo modal em todo o app. Topo na cor da classe com a insígnia no
 * centro, nome da conquista, um incentivo e duas saídas: continuar (fecha) ou ver todas as
 * conquistas (abre a galeria).
 */
export function AchievementUnlockedModal({
  visible,
  name,
  description,
  glyph,
  tierColor,
  onContinue,
  onSeeAll,
}: Props) {
  const { t } = useTranslation();
  const bodyColor = colors.bg.surface;
  const ink = mix(tierColor, colors.bg.base, 0.75);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={[styles.header, { backgroundColor: tierColor }]}>
            <Svg
              width="100%"
              height={HEADER_HEIGHT}
              viewBox={`0 0 360 ${HEADER_HEIGHT}`}
              preserveAspectRatio="xMidYMid slice"
              style={StyleSheet.absoluteFill}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {rays(180, 112).map((points) => (
                <Polygon key={points} points={points} fill={rgba(colors.text.onPrimary, 0.14)} />
              ))}
              <Path d={sparkle(52, 86, 11)} fill={rgba(colors.text.onPrimary, 0.7)} />
              <Path d={sparkle(306, 168, 16)} fill={rgba(colors.text.onPrimary, 0.6)} />
              <Path d={sparkle(318, 60, 8)} fill={rgba(colors.text.onPrimary, 0.5)} />
              <Circle cx={180} cy={112} r={88} fill={rgba(colors.text.onPrimary, 0.22)} />
              <Path
                d={`M0 236 C 70 214, 130 252, 200 238 S 330 214, 360 232 L360 ${HEADER_HEIGHT} L0 ${HEADER_HEIGHT} Z`}
                fill={bodyColor}
              />
            </Svg>
            <View style={styles.badge}>
              <Insignia glyph={glyph} size={92} />
            </View>
            <Text style={[styles.headline, { color: ink }]} accessibilityRole="header">
              {t('feedback.achievementUnlocked')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('feedback.close')}
              onPress={onContinue}
              hitSlop={8}
              style={[styles.close, { backgroundColor: rgba(ink, 0.18) }]}
            >
              <IconX size={22} color={ink} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={[styles.body, { backgroundColor: bodyColor }]}>
            <Text style={styles.name}>{name}</Text>
            {description ? <Text style={styles.description}>{description}</Text> : null}
            <Text style={styles.hint}>{t('feedback.achievementHint')}</Text>
            <View style={styles.actions}>
              <Button label={t('feedback.continue')} onPress={onContinue} />
              <Button
                label={t('feedback.seeAchievements')}
                variant="secondary"
                onPress={onSeeAll}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space[24],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  header: { height: HEADER_HEIGHT, alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: 44,
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: colors.text.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    position: 'absolute',
    bottom: 58,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    top: space[12],
    left: space[12],
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: space[20], paddingBottom: space[20], gap: space[8] },
  name: { color: colors.text.primary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  description: { color: colors.text.secondary, fontSize: 14, textAlign: 'center' },
  hint: {
    color: colors.text.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: space[4],
    marginBottom: space[8],
  },
  actions: { gap: space[12] },
});
