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
      emptyHint={t('todos.emptyHint')}
    />
  );
}
