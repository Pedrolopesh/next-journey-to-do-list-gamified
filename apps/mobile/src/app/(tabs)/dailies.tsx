import { IconCalendarCheck } from '@tabler/icons-react-native';
import { useTranslation } from 'react-i18next';

import { ItemListScreen } from '@/components/item-list-screen';

export default function DailiesScreen() {
  const { t } = useTranslation();
  return (
    <ItemListScreen
      type="daily"
      title={t('dailies.title')}
      emptyTitle={t('dailies.empty')}
      emptyIcon={IconCalendarCheck}
      emptyHint={t('dailies.emptyHint')}
    />
  );
}
