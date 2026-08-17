import { Plugs } from '@gitroom/frontend/components/plugs/plugs';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { brandName } from '@gitroom/helpers/utils/brand';
export const metadata: Metadata = {
  title: `${brandName()} Plugs`,
  description: '',
};
export default async function Index() {
  return <Plugs />;
}
