import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { fetchDataExport } from '@/api/endpoints';
import { Button } from '@/components/button';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';

/**
 * "Exportar meus dados" (LGPD, direito de acesso): busca o JSON da conta e abre a folha de compartilhamento
 * do sistema. O conteúdo passa só pela memória e pela folha; não é gravado nem registrado em log.
 */
export function ExportDataButton() {
  const { t } = useTranslation();
  const { run, loading } = useAction({
    name: 'account.export',
    success: t('settings.exported'),
    error: (cause) => describeError(cause, t),
  });

  return (
    <Button
      label={t('settings.export')}
      variant="secondary"
      loading={loading}
      onPress={() => {
        void run(async () => {
          const data = await fetchDataExport();
          await Share.share({
            title: t('settings.exportTitle'),
            message: JSON.stringify(data, null, 2),
          });
        });
      }}
    />
  );
}
