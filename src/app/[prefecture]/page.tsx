import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPrefectureConfig } from '@/lib/prefecture-config';

interface PageProps {
  params: {
    prefecture: string;
  };
}

export default function PrefecturePage({ params }: PageProps) {
  const prefectureConfig = getPrefectureConfig(params.prefecture);

  if (!prefectureConfig) {
    notFound();
  }

  const { nameJa, blocks } = prefectureConfig;

  return (
    <div className="container-sm my-5">
      <div className="col-lg-12 px-0">
        <h3 className="mb-4">チームみらいマップ {nameJa}</h3>
        <div>
          <a 
            href="/"
            rel="noopener noreferrer" 
            className="link-secondary"
          >
            都道府県へ戻る
          </a>
        </div>

        <div className="list-group mb-4 mt-4">
          <Link 
            href={`/${params.prefecture}/all`} 
            className="list-group-item list-group-item-action"
          >
            {nameJa}全域
          </Link>
          
          {blocks && blocks.map((block) => (
            <Link 
              key={block.id}
              href={`/${params.prefecture}/all?block=${block.id}`} 
              className="list-group-item list-group-item-action"
            >
              {block.name}
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
  );
}