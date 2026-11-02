import { useTranslation } from 'react-i18next';

import { CelebrationModal } from './celebration-modal';
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
