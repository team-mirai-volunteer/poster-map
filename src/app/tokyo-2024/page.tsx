import Link from 'next/link'

interface AreaData {
  block: string | null;
  name: string;
}

interface PrefectureData {
  prefecture_name: string;
  areas: AreaData[];
}

async function getAreaList(prefecture: string): Promise<PrefectureData> {
  const response = await fetch(`/data/${prefecture}/arealist.json`);
  return response.json();
}

export default async function Tokyo2024Page() {
  const areaData = await getAreaList('tokyo-2024');
  
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
