import { MediaLayoutComponent } from '@gitroom/frontend/components/new-layout/layout.media.component';
import { Metadata } from 'next';
import { brandName } from '@gitroom/helpers/utils/brand';

export const metadata: Metadata = {
  title: `${brandName()} Media`,
  description: '',
};

export default async function Page() {
  return <MediaLayoutComponent />
}
