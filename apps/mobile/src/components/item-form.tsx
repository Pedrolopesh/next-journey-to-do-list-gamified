import {
  type CreateItemRequest,
  createItemRequestSchema,
  type Item,
  type ItemType,
  type UpdateItemRequest,
} from '@nextjourney/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCategories } from '@/api/queries';
import { Button } from '@/components/button';
import { Pills } from '@/components/pills';
import { TextField } from '@/components/text-field';
import { toast } from '@/features/feedback/toast-store';
import { dueDateFor, type DuePreset, endOfDayIso } from '@/features/items/due-presets';
import { deviceToday } from '@/features/items/local-date';
import { colors, space } from '@/theme';

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

type Props = {
  /** Item existente (edição) ou nulo (criação). */
  item: Item | null;
  initialType: ItemType;
  submitting: boolean;
  error: string | null;
  onSubmitCreate: (body: CreateItemRequest) => void;
  onSubmitUpdate: (body: UpdateItemRequest) => void;
  onDelete?: () => void;
};

/** Formulário de criar e editar item. Validado com o mesmo schema que a API usa. */
export function ItemForm({
  item,
  initialType,
  submitting,
  error,
  onSubmitCreate,
  onSubmitUpdate,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const categories = useCategories();
  const editing = item !== null;

  const [type, setType] = useState<ItemType>(item?.type ?? initialType);
  const [title, setTitle] = useState(item?.title ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [difficulty, setDifficulty] = useState(item?.difficulty ?? 'medium');
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? null);
  const [days, setDays] = useState<number[]>(item?.scheduleDays ?? [...WEEK_DAYS]);
  const [due, setDue] = useState<DuePreset>(item?.dueAt ? 'today' : 'none');
  const [dueTouched, setDueTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Validação reprovada também avisa por toast, para o botão nunca "não fazer nada"
  useEffect(() => {
    if (formError) toast.error(formError);
  }, [formError]);

  const effectiveCategory = categoryId ?? categories.data?.[0]?.id ?? null;

  const submit = (): void => {
    setFormError(null);
    if (!effectiveCategory) {
      setFormError(t('itemForm.noCategory'));
      return;
    }
    const dueAt =
      type === 'todo' && (dueTouched || !editing)
        ? (() => {
            const date = dueDateFor(due, deviceToday());
            return date ? endOfDayIso(date, new Date().getTimezoneOffset()) : undefined;
          })()
        : undefined;

    if (editing) {
      onSubmitUpdate({
        title: title.trim(),
        notes: notes.trim() === '' ? null : notes.trim(),
        difficulty,
        categoryId: effectiveCategory,
        ...(item.type === 'daily' ? { scheduleDays: days } : {}),
        ...(item.type === 'todo' && dueTouched ? { dueAt: dueAt ?? null } : {}),
      });
      return;
    }

    const base = {
      title: title.trim(),
      categoryId: effectiveCategory,
      difficulty,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    const candidate =
      type === 'daily'
        ? { ...base, type, scheduleDays: days }
        : type === 'todo'
          ? { ...base, type, ...(dueAt ? { dueAt } : {}) }
          : { ...base, type };
    const parsed = createItemRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      setFormError(t(title.trim() === '' ? 'itemForm.titleRequired' : 'itemForm.invalid'));
      return;
    }
    onSubmitCreate(parsed.data);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {!editing ? (
        <View style={styles.group}>
          <Text style={styles.label}>{t('itemForm.type')}</Text>
          <Pills
            label={t('itemForm.type')}
            value={type}
            onChange={setType}
            options={[
              { value: 'daily', label: t('dailies.title') },
              { value: 'todo', label: t('todos.title') },
              { value: 'habit', label: t('habits.title') },
            ]}
          />
        </View>
      ) : null}

      <TextField
        label={t('itemForm.title')}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        error={formError === t('itemForm.titleRequired') ? formError : undefined}
      />

      <View style={styles.group}>
        <Text style={styles.label}>{t('itemForm.category')}</Text>
        <Pills
          scroll
          label={t('itemForm.category')}
          value={effectiveCategory}
          onChange={setCategoryId}
          options={(categories.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
            color: category.color,
          }))}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>{t('itemForm.difficulty')}</Text>
        <Pills
          label={t('itemForm.difficulty')}
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: 'easy', label: t('difficulty.easy'), color: colors.status.success },
            { value: 'medium', label: t('difficulty.medium'), color: colors.status.warning },
            { value: 'hard', label: t('difficulty.hard'), color: colors.status.danger },
          ]}
        />
      </View>

      {type === 'daily' ? (
        <View style={styles.group}>
          <Text style={styles.label}>{t('itemForm.days')}</Text>
          <View style={styles.days}>
            {WEEK_DAYS.map((day) => {
              const selected = days.includes(day);
              return (
                <Button
                  key={day}
                  label={t(`itemForm.weekday.${day}`)}
                  variant={selected ? 'primary' : 'secondary'}
                  onPress={() => {
                    // sempre pelo menos um dia
                    setDays((current) =>
                      selected
                        ? current.length > 1
                          ? current.filter((d) => d !== day)
                          : current
                        : [...current, day].sort(),
                    );
                  }}
                />
              );
            })}
          </View>
        </View>
      ) : null}

      {type === 'todo' ? (
        <View style={styles.group}>
          <Text style={styles.label}>{t('itemForm.due')}</Text>
          <Pills
            label={t('itemForm.due')}
            value={due}
            onChange={(value) => {
              setDue(value);
              setDueTouched(true);
            }}
            options={[
              { value: 'none', label: t('itemForm.dueNone') },
              { value: 'today', label: t('itemForm.dueToday') },
              { value: 'tomorrow', label: t('itemForm.dueTomorrow') },
              { value: 'week', label: t('itemForm.dueWeek') },
            ]}
          />
        </View>
      ) : null}

      <TextField
        label={t('itemForm.notes')}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={1000}
      />

      {formError && formError !== t('itemForm.titleRequired') ? (
        <Text style={styles.error}>{formError}</Text>
      ) : null}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Button
        label={t(editing ? 'itemForm.save' : 'itemForm.create')}
        onPress={submit}
        loading={submitting}
      />
      {editing && onDelete ? (
        <Button label={t('itemForm.delete')} variant="ghost" onPress={onDelete} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.screenMargin, gap: space[16], paddingBottom: space[40] },
  group: { gap: space[8] },
  label: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: space[4] },
  error: { color: colors.status.danger, fontSize: 13 },
});
