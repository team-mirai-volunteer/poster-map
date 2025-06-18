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

export default async function TokyoPage() {
  const areaData = await getAreaList('tokyo');
  
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
