import Link from 'next/link'

export default function Home() {
  return (
    <div className="container-sm my-5">
      <div className="col-lg-12 px-0">
        <h3 className="mb-4">安野たかひろ 選挙掲示板マップ</h3>

        <div className="list-group mb-4">
          <Link href="/summary" className="list-group-item list-group-item-action">
            市区町村別進捗可視化
          </Link>
        </div>

        <div className="list-group mb-4">
          <Link href="/map" className="list-group-item list-group-item-action">
            東京都全域
          </Link>
          <Link href="/map?block=23-city" className="list-group-item list-group-item-action">
            23区都心部
          </Link>
          <Link href="/map?block=23-east" className="list-group-item list-group-item-action">
            23区東部
          </Link>
          <Link href="/map?block=23-west" className="list-group-item list-group-item-action">
            23区南部・西部
          </Link>
          <Link href="/map?block=tama-north" className="list-group-item list-group-item-action">
            多摩北部
          </Link>
          <Link href="/map?block=tama-south" className="list-group-item list-group-item-action">
            多摩南部
          </Link>
          <Link href="/map?block=tama-west" className="list-group-item list-group-item-action">
            多摩西部
          </Link>
          <Link href="/map?block=island" className="list-group-item list-group-item-action">
            島しょ部
          </Link>
        </div>

        <div className="list-group mb-4">
          <Link href="/vote" className="list-group-item list-group-item-action">
            期日前投票所
          </Link>
        </div>

        <div className="list-group mb-4">
          <Link href="/posting" className="list-group-item list-group-item-action">
            posting
          </Link>
        </div>

        <div>
          <a 
            href="https://takahiroanno.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-secondary"
          >
            安野たかひろ 公式ホームページ
          </a>
        </div>
      </div>
    </div>
  )
}