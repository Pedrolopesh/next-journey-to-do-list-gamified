import { IconFlame } from '@tabler/icons-react-native';
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
      emptyIcon={IconFlame}
      emptyHint={t('habits.emptyHint')}
    />
  );
}
