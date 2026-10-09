import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function HomeScreen() {
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('tabs.home')} />;
}
