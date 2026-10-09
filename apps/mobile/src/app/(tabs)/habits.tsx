import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/tab-screen';

export default function HabitsScreen() {
  const { t } = useTranslation();

  return <TabScreen title={t('tabs.habits')} />;
}
