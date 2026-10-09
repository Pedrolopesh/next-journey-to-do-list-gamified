import { useTranslation } from 'react-i18next';

import { ItemListScreen } from '@/components/item-list-screen';

export default function DailiesScreen() {
  const { t } = useTranslation();
  return (
    <ItemListScreen
      type="daily"
      title={t('dailies.title')}
      emptyTitle={t('dailies.empty')}
      emptyHint={t('dailies.emptyHint')}
    />
  );
}
