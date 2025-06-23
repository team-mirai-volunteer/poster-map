import MapClient from '@/app/[prefecture]/MapClient'
import { loadPrefectureData } from '@/lib/server-data';
import { getAllPrefectures } from '@/lib/prefecture-config';

interface PageProps {
    params: Promise<{
    prefecture: string;
    }>;
}

export default async function MapPage({ params }: PageProps) {
    const { prefecture } = await params;
    const data = await loadPrefectureData(prefecture);
    return (
    <MapClient prefecture={prefecture} prefectureData={data} />
    );
}

export async function generateStaticParams() {
    const prefectures = getAllPrefectures();
    return prefectures.map((prefecture) => ({
        prefecture: prefecture.id,
    }));
}
