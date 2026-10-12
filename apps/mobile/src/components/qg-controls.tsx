import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Pills } from '@/components/pills';
import { toast } from '@/features/feedback/toast-store';
import { SCENARIOS, STORY_SCENARIOS, TIME_MODES, timeOfDayFor } from '@/features/qg/options';
import { useQgPrefs } from '@/features/qg/qg-store';
import { colors, radius, space } from '@/theme';

/** Escolha do ambiente do QG: cenário e hora do dia. Vale na Home e na prévia do personagem. */
export function QgControls() {
  const { t } = useTranslation();
  const { scenario, storyScenario, timeMode, setScenario, setStoryScenario, setTimeMode } =
    useQgPrefs();
  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <Text style={styles.label}>{t('qg.scenario')}</Text>
        <Pills
          scroll
          label={t('qg.scenario')}
          value={scenario}
          onChange={(value) => {
            setScenario(value);
            toast.success(t('qg.scenarioSaved', { name: t(`qg.scenarios.${value}`) }));
          }}
          options={SCENARIOS.map((value) => ({ value, label: t(`qg.scenarios.${value}`) }))}
        />
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>{t('qg.storyScenario')}</Text>
        <Pills
          scroll
          label={t('qg.storyScenario')}
          value={storyScenario}
          onChange={(value) => {
            setStoryScenario(value);
            toast.success(t('qg.scenarioSaved', { name: t(`qg.scenarios.${value}`) }));
          }}
          options={STORY_SCENARIOS.map((value) => ({ value, label: t(`qg.scenarios.${value}`) }))}
        />
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>{t('qg.time')}</Text>
        <Pills
          scroll
          label={t('qg.time')}
          value={timeMode}
          onChange={(value) => {
            setTimeMode(value);
            toast.success(t('qg.timeSaved', { name: t(`qg.times.${value}`) }));
          }}
          options={TIME_MODES.map((value) => ({
            value,
            label:
              value === 'auto'
                ? t('qg.timeAutoNow', { name: t(`qg.times.${timeOfDayFor(new Date())}`) })
                : t(`qg.times.${value}`),
          }))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space[12],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.card,
    padding: space[12],
  },
  group: { gap: space[8] },
  label: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
});
