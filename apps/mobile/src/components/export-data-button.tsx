import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { fetchDataExport } from '@/api/endpoints';
import { Button } from '@/components/button';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';

/** The person closed the share sheet without sending the file. */
class Dismissed extends Error {}

/**
 * "Exportar meus dados" (LGPD, right of access): fetches the account JSON and opens the system share
 * sheet. The content only goes through memory and the sheet; it is neither saved nor logged. The JSON is
 * compact (no indentation) to fit the size limit of Android's share sheet.
 */
export function ExportDataButton() {
  const { t } = useTranslation();
  const { run, loading } = useAction({
    name: 'account.export',
    success: t('settings.exported'),
    error: (cause) =>
      cause instanceof Dismissed ? t('settings.exportCancelled') : describeError(cause, t),
  });

  return (
    <Button
      label={t('settings.export')}
      variant="secondary"
      loading={loading}
      onPress={() => {
        void run(async () => {
          const data = await fetchDataExport();
          const result = await Share.share({
            title: t('settings.exportTitle'),
            message: JSON.stringify(data),
          });
          if (result.action === Share.dismissedAction) throw new Dismissed();
        });
      }}
    />
  );
}
