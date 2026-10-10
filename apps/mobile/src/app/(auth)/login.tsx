import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginRequest, loginRequestSchema } from '@nextjourney/contracts';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { login } from '@/api/endpoints';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { SocialButtons } from '@/components/social-buttons';
import { TextField } from '@/components/text-field';
import { describeError } from '@/features/feedback/error-message';
import { toast } from '@/features/feedback/toast-store';
import { useAction } from '@/features/feedback/use-action';
import { log } from '@/logging';
import { colors, space } from '@/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { run, loading } = useAction({
    name: 'auth.login',
    success: t('auth.loginSuccess'),
    error: (error) => describeError(error, t, { UNAUTHORIZED: t('auth.invalidCredentials') }),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(
    (values) =>
      run(async () => {
        await useSessionStore.getState().setSession(await login(values));
      }),
    (invalid) => {
      log.warn('form.invalid', { form: 'login', fields: Object.keys(invalid) });
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
          {t('auth.login')}
        </Text>
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
              autoComplete="current-password"
              secret
            />
          )}
        />
        <Button label={t('auth.submitLogin')} onPress={() => void onSubmit()} loading={loading} />
        <SocialButtons />
        <View style={styles.links}>
          <Link href="/register" style={styles.link}>
            {t('auth.goToRegister')}
          </Link>
          <Link href="/forgot-password" style={styles.link}>
            {t('auth.forgotPassword')}
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg.base },
  container: { padding: space.screenMargin, paddingTop: space[40], gap: space[16] },
  title: { color: colors.text.primary, fontSize: 24, fontWeight: '700' },
  formError: { color: colors.status.danger, fontSize: 13 },
  links: { alignItems: 'center', gap: space[12], marginTop: space[8] },
  link: { color: colors.brand.primaryLight, fontSize: 13 },
});
