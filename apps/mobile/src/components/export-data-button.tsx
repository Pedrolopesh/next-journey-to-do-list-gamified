import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { fetchDataExport } from '@/api/endpoints';
import { Button } from '@/components/button';
import { describeError } from '@/features/feedback/error-message';
import { useAction } from '@/features/feedback/use-action';

/** A pessoa fechou a folha de compartilhamento sem enviar o arquivo. */
class Dismissed extends Error {}

/**
 * "Exportar meus dados" (LGPD, direito de acesso): busca o JSON da conta e abre a folha de compartilhamento
 * do sistema. O conteúdo passa só pela memória e pela folha; não é gravado nem registrado em log. O JSON vai
 * compacto (sem indentação) para caber no limite de tamanho da folha de compartilhamento do Android.
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
