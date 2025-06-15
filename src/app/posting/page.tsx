import { redirect } from 'next/navigation';

// Original contents commented out - redirecting to new map
// import type { Metadata } from 'next';
// import PostingPageClient from './PostingPageClient';
// 
// export const metadata: Metadata = {
//   title: 'チームみらい機関誌配布マップ',
//   description: 'チームみらい機関誌配布マップ',
// };
// 
// export default function PostingPage() {
//   return <PostingPageClient />;
// }

export default function PostingPage() {
  redirect('https://action.team-mir.ai/map/posting');
}
