import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginRequest, loginRequestSchema } from '@nextjourney/contracts';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { login } from '@/api/endpoints';
import { isNetworkError, toApiError } from '@/api/errors';
import { useSessionStore } from '@/auth/session-store';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { colors, space } from '@/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await useSessionStore.getState().setSession(await login(values));
    } catch (error) {
      if (isNetworkError(error)) setFormError(t('auth.networkError'));
      else if (toApiError(error)?.code === 'UNAUTHORIZED')
        setFormError(t('auth.invalidCredentials'));
      else setFormError(t('auth.genericError'));
    }
  });

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
        {formError ? (
          <Text style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <Button
          label={t('auth.submitLogin')}
          onPress={() => void onSubmit()}
          loading={isSubmitting}
        />
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
