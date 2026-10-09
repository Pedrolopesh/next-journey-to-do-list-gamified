import { useTranslation } from 'react-i18next';

import { TabScreen } from '@/components/tab-screen';

export default function TodosScreen() {
  const { t } = useTranslation();

  return <TabScreen title={t('tabs.todos')} />;
}
