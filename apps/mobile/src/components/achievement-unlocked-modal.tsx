import { useTranslation } from 'react-i18next';

import { CelebrationModal } from './celebration-modal';
import { Insignia } from './pixel-art';

type Props = {
  visible: boolean;
  name: string;
  /** Achievement criterion (optional: hidden while the catalog has not loaded yet). */
  description?: string | undefined;
  /** Badge (name in `@nextjourney/insignias`). */
  glyph: string;
  /** Frame color (class) earned: paints the top of the modal. */
  tierColor: string;
  onContinue: () => void;
  onSeeAll: () => void;
};

/**
 * New achievement alert: the same modal across the app. Top in the class color with the badge in the
 * center, the achievement name, an encouragement and two exits: continue (closes) or see all the
 * achievements (opens the gallery).
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
  return (
    <CelebrationModal
      visible={visible}
      tone={tierColor}
      art={<Insignia glyph={glyph} size={92} />}
      headline={t('feedback.achievementUnlocked')}
      title={name}
      description={description}
      hint={t('feedback.achievementHint')}
      primaryLabel={t('feedback.continue')}
      onPrimary={onContinue}
      secondaryLabel={t('feedback.seeAchievements')}
      onSecondary={onSeeAll}
      onClose={onContinue}
    />
  );
}
