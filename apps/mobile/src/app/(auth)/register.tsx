import { useTranslation } from 'react-i18next';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function UregisterScreen() {
  const { t } = useTranslation();

  return <ScreenPlaceholder title={t('auth.register')} />;
}
