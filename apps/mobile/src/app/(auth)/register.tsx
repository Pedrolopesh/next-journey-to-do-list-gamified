import { zodResolver } from '@hookform/resolvers/zod';
import { registerRequestSchema } from '@nextjourney/contracts';
import { Link } from 'expo-router';
import { Controller, type Resolver, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { register } from '@/api/endpoints';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { PasswordChecklist } from '@/components/password-checklist';
import { SocialButtons } from '@/components/social-buttons';
import { TextField } from '@/components/text-field';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { log } from '@/logging';
import { colors, space } from '@/theme';

/** Versão dos Termos e da Política aceitos no cadastro (LGPD). Sobe quando os textos mudarem. */
const TERMS_VERSION = '2026-10-01';

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { run, loading } = useAction({
    name: 'auth.register',
    success: t('auth.registerSuccess'),
    error: (error) => describeError(error, t, { EMAIL_UNAVAILABLE: t('auth.emailUnavailable') }),
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    // O schema do contrato é a mesma regra que a API aplica (inclusive o checklist da senha).
    // termsVersion e timezone não são campos da tela: entram aqui, senão o schema reprova o
    // formulário em silêncio e o botão parece não fazer nada.
    resolver: ((values, context, options) =>
      zodResolver(registerRequestSchema)(
        { ...values, termsVersion: TERMS_VERSION, timezone } as never,
        context,
        options as never,
      )) as Resolver<FormValues>,
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptedTerms: false },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(
    (values) =>
      run(async () => {
        const response = await register({
          name: values.name,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          acceptedTerms: true,
          termsVersion: TERMS_VERSION,
          timezone,
        });
        await useSessionStore.getState().setSession(response);
      }),
    (invalid) => {
      log.warn('form.invalid', { form: 'register', fields: Object.keys(invalid) });
      toast.error(t('feedback.invalidForm'));
    },
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          {t('auth.register')}
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              label={t('auth.nameLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoComplete="name"
              error={errors.name ? t('auth.validation.nameRequired') : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              label={t('auth.emailLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={errors.email ? t('auth.validation.emailInvalid') : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label={t('auth.passwordLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              autoComplete="new-password"
              secret
              error={errors.password ? t('auth.validation.passwordRules') : undefined}
            />
          )}
        />
        <PasswordChecklist password={password} />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField
              label={t('auth.confirmPasswordLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              secret
              error={errors.confirmPassword ? t('auth.validation.passwordMismatch') : undefined}
            />
          )}
        />
        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field }) => (
            <View style={styles.terms}>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                accessibilityLabel={t('auth.terms')}
                trackColor={{ true: colors.brand.primary, false: colors.border.strong }}
              />
              <Text style={styles.termsText}>{t('auth.terms')}</Text>
            </View>
          )}
        />
        {errors.acceptedTerms ? (
          <Text style={styles.formError}>{t('auth.validation.termsRequired')}</Text>
        ) : null}
        <Button
          label={t('auth.submitRegister')}
          onPress={() => void onSubmit()}
          loading={loading}
        />
        <SocialButtons />
        <Link href="/login" style={styles.link}>
          {t('auth.goToLogin')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg.base },
  container: { padding: space.screenMargin, paddingTop: space[40], gap: space[16] },
  title: { color: colors.text.primary, fontSize: 24, fontWeight: '700' },
  terms: { flexDirection: 'row', alignItems: 'center', gap: space[12] },
  termsText: { flex: 1, color: colors.text.secondary, fontSize: 13 },
  formError: { color: colors.status.danger, fontSize: 13 },
  link: { color: colors.brand.primaryLight, fontSize: 13, textAlign: 'center' },
});
