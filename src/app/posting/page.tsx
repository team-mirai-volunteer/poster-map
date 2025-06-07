import type { Metadata } from 'next';
import PostingPageClient from './PostingPageClient';

export const metadata: Metadata = {
  title: 'チームみらい機関誌配布マップ',
  description: 'チームみらい機関誌配布マップ',
};

export default function PostingPage() {
  return <PostingPageClient />;
}
