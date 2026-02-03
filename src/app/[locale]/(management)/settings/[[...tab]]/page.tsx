import SettingsPageView from '@/features/settings/views/SettingsPageView';
import { SettingsTab } from '@/features/settings/types';

const VALID_TABS: SettingsTab[] = ['store', 'plan', 'account'];

interface SettingsPageProps {
  params: Promise<{
    locale: string;
    tab?: string[];
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { tab } = await params;

  // Extract tab from URL path (e.g., /settings/account -> 'account')
  const tabFromUrl = tab?.[0] as SettingsTab | undefined;

  // Validate tab - default to 'account' if invalid or not provided
  const activeTab: SettingsTab = tabFromUrl && VALID_TABS.includes(tabFromUrl)
    ? tabFromUrl
    : 'account';

  return <SettingsPageView initialTab={activeTab} />;
}
