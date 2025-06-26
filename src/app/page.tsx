import Link from 'next/link'

export default function Home() {
  return (
    <div className="container-sm my-5">
      <div className="col-lg-12 px-0">
        <h3 className="mb-4">チームみらいマップ 都道府県</h3>
        <div className="list-group mb-4">
          <Link href="/all" className="list-group-item list-group-item-action">
            全国
          </Link>
          <Link href="/hokkaido" className="list-group-item list-group-item-action">
            北海道
          </Link>
          <Link href="/miyagi" className="list-group-item list-group-item-action">
            宮城県
          </Link>
          <Link href="/saitama" className="list-group-item list-group-item-action">
            埼玉県
          </Link>
          <Link href="/chiba" className="list-group-item list-group-item-action">
            千葉県
          </Link>
          <Link href="/tokyo" className="list-group-item list-group-item-action">
            東京都
          </Link>
          <Link href="/tokyo-2024" className="list-group-item list-group-item-action">
            東京都 (2024アーカイブ)
          </Link>
          <Link href="/kanagawa" className="list-group-item list-group-item-action">
            神奈川県
          </Link>
          <Link href="/nagano" className="list-group-item list-group-item-action">
            長野県
          </Link>
          <Link href="/aichi" className="list-group-item list-group-item-action">
            愛知県
          </Link>
          <Link href="/osaka" className="list-group-item list-group-item-action">
            大阪府
          </Link>
          <Link href="/hyogo" className="list-group-item list-group-item-action">
            兵庫県
          </Link>
          <Link href="/ehime" className="list-group-item list-group-item-action">
            愛媛県
          </Link>
          <Link href="/fukuoka" className="list-group-item list-group-item-action">
            福岡県
          </Link>
        </div>
        <div>
          <a 
            href="https://team-mir.ai/"
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-secondary"
          >
            チームみらい 公式ホームページ
          </a>
        </div>
      </div>
    </div>
  )
}
