import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/tab-screen';

export default function ProfileScreen() {
  const { t } = useTranslation();

  return <TabScreen title={t('tabs.profile')} />;
}
