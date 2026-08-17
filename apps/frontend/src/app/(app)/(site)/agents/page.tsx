import { Metadata } from 'next';
import { brandName } from '@gitroom/helpers/utils/brand';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: `${brandName()} - Agent`,
  description: '',
};

export default async function Page() {
  return redirect('/agents/new');
}
