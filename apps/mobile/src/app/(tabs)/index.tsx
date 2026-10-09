import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/tab-screen';

export default function HomeScreen() {
  const { t } = useTranslation();

  return <TabScreen title={t('tabs.home')} />;
}
