'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAreaList } from '@/lib/api';

interface AreaData {
  block: string | null;
  name: string;
}

interface PrefectureData {
  prefecture_name: string;
  areas: AreaData[];
}

export default function Tokyo2024Page() {
  const [areaData, setAreaData] = useState<PrefectureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAreaList('tokyo-2024');
        setAreaData(data as unknown as PrefectureData);
      } catch (error) {
        console.error('Error loading area data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!areaData) {
    return <div>Error loading data</div>;
  }
  
  return (
    <div className="container-sm my-5">
      <div className="col-lg-12 px-0">
        <h3 className="mb-4">チームみらいマップ {areaData.prefecture_name}</h3>
        <div className="alert alert-info mb-4">
          <strong>参考版:</strong> これは2024年の東京都データの参考版です。現在のデータは<Link href="/tokyo" className="alert-link">こちら</Link>をご覧ください。
        </div>
        <div>
          <a 
            href="/"
            rel="noopener noreferrer" 
            className="link-secondary"
          >
            都道府県へ戻る
          </a>
        </div>
        <div className="list-group mb-4">
          {areaData.areas.map((area, index) => (
            <Link 
              key={index}
              href={area.block ? `/map/tokyo/all?block=${area.block}` : `/map/tokyo/all`} 
              className="list-group-item list-group-item-action"
            >
              {area.name}
            </Link>
          ))}
        </div>
        <div>
          <a 
            href="/"
            rel="noopener noreferrer" 
            className="link-secondary"
          >
            都道府県へ戻る
          </a>
        </div>
      </div>
    </div>
  )
}
