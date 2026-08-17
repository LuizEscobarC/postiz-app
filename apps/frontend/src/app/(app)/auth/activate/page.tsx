export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { Activate } from '@gitroom/frontend/components/auth/activate';
import { brandName } from '@gitroom/helpers/utils/brand';
export const metadata: Metadata = {
  title: `${brandName()} - Activate your account`,
  description: '',
};
export default async function Auth() {
  return <Activate />;
}
