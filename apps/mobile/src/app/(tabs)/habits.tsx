import { useTranslation } from 'react-i18next';

import { ItemListScreen } from '@/components/item-list-screen';

export default function HabitsScreen() {
  const { t } = useTranslation();
  return (
    <ItemListScreen
      type="habit"
      counters
      title={t('habits.title')}
      emptyTitle={t('habits.empty')}
      emptyHint={t('habits.emptyHint')}
    />
  );
}
