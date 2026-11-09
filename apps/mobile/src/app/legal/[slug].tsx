import {
  type LegalDocument,
  type LegalSection,
  type LegalSlug,
  legalSlugSchema,
} from '@nextjourney/contracts';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useLegalDocument } from '@/api/queries';
import { ScreenFrame } from '@/components/screen-frame';
import { ErrorState, SkeletonList } from '@/components/states';
import { colors, fontSize, space } from '@/theme';

/** 2026-11-08 becomes 08/11/2026. */
const brDate = (iso: string): string => iso.split('-').reverse().join('/');

function Section({ section }: { section: LegalSection }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        {section.heading}
      </Text>
      {section.paragraphs.map((text, index) => (
        <Text key={`p${index}`} style={styles.text}>
          {text}
        </Text>
      ))}
      {section.bullets.map((text, index) => (
        <View key={`b${index}`} style={styles.bullet}>
          <Text style={styles.text} accessibilityElementsHidden importantForAccessibility="no">
            •
          </Text>
          <Text style={[styles.text, styles.bulletText]}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

function Body({ document }: { document: LegalDocument }) {
  const { t } = useTranslation();
  return (
    <>
      <Text style={styles.meta}>
        {t('legal.updated', { version: document.version, date: brDate(document.updatedAt) })}
      </Text>
      {document.sections.map((section) => (
        <Section key={section.heading} section={section} />
      ))}
    </>
  );
}

/** The text of one known document: fetches it and shows loading, the error or the sections. */
function LegalContent({ slug }: { slug: LegalSlug }) {
  const { t } = useTranslation();
  const { data, isError, isLoading, isRefetching, refetch } = useLegalDocument(slug);

  return (
    <ScreenFrame title={t(`legal.${slug}`)}>
      {isError ? (
        <ErrorState
          message={t('legal.loadFailed')}
          retryLabel={t('legal.retry')}
          retrying={isRefetching}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : isLoading || data === undefined ? (
        <SkeletonList rows={6} />
      ) : (
        <Body document={data} />
      )}
    </ScreenFrame>
  );
}

/** A legal text (Terms of Use or Privacy Policy) exactly as the API serves it. */
export default function LegalScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ slug: string }>();
  const parsed = legalSlugSchema.safeParse(params.slug);

  if (!parsed.success) {
    return (
      <ScreenFrame title={t('legal.terms')}>
        <Text style={styles.meta}>{t('legal.notFound')}</Text>
      </ScreenFrame>
    );
  }
  return <LegalContent slug={parsed.data} />;
}

const styles = StyleSheet.create({
  meta: { color: colors.text.muted, fontSize: fontSize[12] },
  section: { gap: space[8], marginTop: space[12] },
  heading: { color: colors.text.primary, fontSize: fontSize[16], fontWeight: '700' },
  text: { color: colors.text.secondary, fontSize: fontSize[14], lineHeight: 21 },
  bullet: { flexDirection: 'row', gap: space[8], paddingLeft: space[4] },
  bulletText: { flex: 1 },
});
