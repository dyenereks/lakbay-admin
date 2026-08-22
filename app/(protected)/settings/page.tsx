import { getSiteSettings } from '@/lib/settings-data';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  return <SettingsForm initialSettings={settings} />;
}
