import {
  IconCalendarCheck,
  IconChecklist,
  IconFlame,
  IconHome,
  IconUser,
} from '@tabler/icons-react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useItems } from '@/api/queries';
import { colors, size } from '@/theme';

const ICON_STROKE = 1.75;

export default function TabsLayout() {
  const { t } = useTranslation();
  const dailies = useItems('daily');
  const pending = dailies.data?.filter((item) => !item.doneToday).length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg.base },
        tabBarActiveTintColor: colors.brand.primaryLight,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          height: size.navBarHeight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <IconHome color={color} size={size.iconSize} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="dailies"
        options={{
          title: t('tabs.dailies'),
          ...(pending > 0 ? { tabBarBadge: pending } : {}),
          tabBarIcon: ({ color }) => (
            <IconCalendarCheck color={color} size={size.iconSize} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: t('tabs.todos'),
          tabBarIcon: ({ color }) => (
            <IconChecklist color={color} size={size.iconSize} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: t('tabs.habits'),
          tabBarIcon: ({ color }) => (
            <IconFlame color={color} size={size.iconSize} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <IconUser color={color} size={size.iconSize} strokeWidth={ICON_STROKE} />
          ),
        }}
      />
    </Tabs>
  );
}
