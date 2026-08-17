export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { PlatformAnalytics } from '@gitroom/frontend/components/platform-analytics/platform.analytics';
import { brandName } from '@gitroom/helpers/utils/brand';
export const metadata: Metadata = {
  title: `${brandName()} Analytics`,
  description: '',
};
export default async function Index() {
  return <PlatformAnalytics />;
}
