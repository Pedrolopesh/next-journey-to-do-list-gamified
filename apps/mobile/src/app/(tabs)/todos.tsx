import { IconChecklist } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';

import { ItemListScreen } from '@/components/item-list-screen';

export default function TodosScreen() {
  const { t } = useTranslation();
  return (
    <ItemListScreen
      type="todo"
      groupByCategory
      title={t('todos.title')}
      emptyTitle={t('todos.empty')}
      emptyIcon={IconChecklist}
      emptyHint={t('todos.emptyHint')}
      historyNotice={t('todos.historyNotice')}
    />
  );
}
