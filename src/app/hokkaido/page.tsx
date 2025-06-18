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

export default function HokkaidoPage() {
  const [areaData, setAreaData] = useState<PrefectureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAreaList('hokkaido');
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
              href={area.block ? `/map/hokkaido/all?block=${area.block}` : `/map/hokkaido/all`} 
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
