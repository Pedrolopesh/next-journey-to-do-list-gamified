import { IconX } from '@tabler/icons-react-native';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import { colors, fontSize, mix, radius, rgba, space } from '@/theme';

import { Button } from './button';

type Props = {
  visible: boolean;
  /** Color of the top: the tier of an achievement, the brand color for levels and chapters. */
  tone: string;
  /** Drawn inside the round badge at the center of the top (insignia or icon). */
  art: ReactNode;
  /** Short line at the bottom of the top ("Nível 2!", "Conquista desbloqueada!"). */
  headline: string;
  title?: string | undefined;
  description?: string | undefined;
  hint?: string | undefined;
  /** Extra content below the texts (progress, date). */
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Closes without choosing (the X and the system back). */
  onClose: () => void;
};

const HEADER_HEIGHT = 270;
const RAYS = 14;

/** Rays of the glow behind the badge (alternating triangles, center in cx, cy). */
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

/** Four-point sparkle around the badge. */
function sparkle(x: number, y: number, r: number): string {
  const t = r * 0.18;
  return `M${x} ${y - r} L${x + t} ${y - t} L${x + r} ${y} L${x + t} ${y + t} L${x} ${y + r} L${x - t} ${y + t} L${x - r} ${y} L${x - t} ${y - t} Z`;
}

/**
 * The one celebration modal of the app (new achievement, achievement details, level up, chapter
 * completed): colored top with rays and sparkles, a badge, the texts and one or two actions.
 */
export function CelebrationModal({
  visible,
  tone,
  art,
  headline,
  title,
  description,
  hint,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const bodyColor = colors.bg.surface;
  const ink = mix(tone, colors.bg.base, 0.75);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={[styles.header, { backgroundColor: tone }]}>
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
            <View style={styles.badge}>{art}</View>
            <Text style={[styles.headline, { color: ink }]} accessibilityRole="header">
              {headline}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('feedback.close')}
              onPress={onClose}
              hitSlop={8}
              style={[styles.close, { backgroundColor: rgba(ink, 0.18) }]}
            >
              <IconX size={22} color={ink} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={[styles.body, { backgroundColor: bodyColor }]}>
            {title ? <Text style={styles.name}>{title}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
            {children}
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            <View style={styles.actions}>
              <Button label={primaryLabel} onPress={onPrimary} />
              {secondaryLabel && onSecondary ? (
                <Button
                  label={secondaryLabel}
                  variant="secondary"
                  backdrop={bodyColor}
                  onPress={onSecondary}
                />
              ) : null}
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
    fontSize: fontSize[22],
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
  body: { paddingHorizontal: space[20], paddingBottom: space[24], gap: space[8] },
  name: {
    color: colors.text.primary,
    fontSize: fontSize[20],
    fontWeight: '700',
    textAlign: 'center',
  },
  description: { color: colors.text.secondary, fontSize: fontSize[14], textAlign: 'center' },
  hint: {
    color: colors.text.muted,
    fontSize: fontSize[13],
    textAlign: 'center',
    marginTop: space[4],
    marginBottom: space[8],
  },
  actions: { gap: space[16], marginTop: space[8] },
});
