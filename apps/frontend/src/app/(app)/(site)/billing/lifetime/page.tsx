import { LifetimeDeal } from '@gitroom/frontend/components/billing/lifetime.deal';
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { brandName } from '@gitroom/helpers/utils/brand';
export const metadata: Metadata = {
  title: `${brandName()} Lifetime deal`,
  description: '',
};
export default async function Page() {
  return <LifetimeDeal />;
}
