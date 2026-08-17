export const dynamic = 'force-dynamic';
import { LaunchesComponent } from '@gitroom/frontend/components/launches/launches.component';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
import { brandName } from '@gitroom/helpers/utils/brand';
export const metadata: Metadata = {
  title: `${brandName()} ${isGeneralServerSide() ? 'Calendar' : 'Launches'}`,
  description: '',
};
export default async function Index() {
  return <LaunchesComponent />;
}
