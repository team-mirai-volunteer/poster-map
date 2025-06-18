import Link from 'next/link'

export default function MiyagiPage() {
    return (
    <div className="container-sm my-5">
        <div className="col-lg-12 px-0">
            <h3 className="mb-4">チームみらいマップ 宮城県</h3>
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
                <Link href="/map/miyagi/all" className="list-group-item list-group-item-action">
                    宮城県全域
                </Link>
                <Link href="/map/miyagi/all?block=sendai" className="list-group-item list-group-item-action">
                    仙台市
                </Link>
                <Link href="/map/miyagi/all?block=ishinomaki" className="list-group-item list-group-item-action">
                    石巻市
                </Link>
                <Link href="/map/miyagi/all?block=shiogama" className="list-group-item list-group-item-action">
                    塩竈市
                </Link>
                <Link href="/map/miyagi/all?block=kesennuma" className="list-group-item list-group-item-action">
                    気仙沼市
                </Link>
                <Link href="/map/miyagi/all?block=shiroishi" className="list-group-item list-group-item-action">
                    白石市
                </Link>
                <Link href="/map/miyagi/all?block=natori" className="list-group-item list-group-item-action">
                    名取市
                </Link>
                <Link href="/map/miyagi/all?block=kakuda" className="list-group-item list-group-item-action">
                    角田市
                </Link>
                <Link href="/map/miyagi/all?block=tagajo" className="list-group-item list-group-item-action">
                    多賀城市
                </Link>
                <Link href="/map/miyagi/all?block=iwanuma" className="list-group-item list-group-item-action">
                    岩沼市
                </Link>
                <Link href="/map/miyagi/all?block=tome" className="list-group-item list-group-item-action">
                    登米市
                </Link>
                <Link href="/map/miyagi/all?block=kurihara" className="list-group-item list-group-item-action">
                    栗原市
                </Link>
                <Link href="/map/miyagi/all?block=higashimatsushima" className="list-group-item list-group-item-action">
                    東松島市
                </Link>
                <Link href="/map/miyagi/all?block=osaki" className="list-group-item list-group-item-action">
                    大崎市
                </Link>
                <Link href="/map/miyagi/all?block=tomiya" className="list-group-item list-group-item-action">
                    富谷市
                </Link>
                <Link href="/map/miyagi/all?block=zao" className="list-group-item list-group-item-action">
                    蔵王町
                </Link>
                <Link href="/map/miyagi/all?block=shichikashuku" className="list-group-item list-group-item-action">
                    七ヶ宿町
                </Link>
                <Link href="/map/miyagi/all?block=ogawara" className="list-group-item list-group-item-action">
                    大河原町
                </Link>
                <Link href="/map/miyagi/all?block=murata" className="list-group-item list-group-item-action">
                    村田町
                </Link>
                <Link href="/map/miyagi/all?block=shibata" className="list-group-item list-group-item-action">
                    柴田町
                </Link>
                <Link href="/map/miyagi/all?block=kawasaki" className="list-group-item list-group-item-action">
                    川崎町
                </Link>
                <Link href="/map/miyagi/all?block=marumori" className="list-group-item list-group-item-action">
                    丸森町
                </Link>
                <Link href="/map/miyagi/all?block=watari" className="list-group-item list-group-item-action">
                    亘理町
                </Link>
                <Link href="/map/miyagi/all?block=yamamoto" className="list-group-item list-group-item-action">
                    山元町
                </Link>
                <Link href="/map/miyagi/all?block=matsushima" className="list-group-item list-group-item-action">
                    松島町
                </Link>
                <Link href="/map/miyagi/all?block=shichigahama" className="list-group-item list-group-item-action">
                    七ヶ浜町
                </Link>
                <Link href="/map/miyagi/all?block=rifu" className="list-group-item list-group-item-action">
                    利府町
                </Link>
                <Link href="/map/miyagi/all?block=taiwa" className="list-group-item list-group-item-action">
                    大和町
                </Link>
                <Link href="/map/miyagi/all?block=osato" className="list-group-item list-group-item-action">
                    大郷町
                </Link>
                <Link href="/map/miyagi/all?block=ohira" className="list-group-item list-group-item-action">
                    大衡村
                </Link>
                <Link href="/map/miyagi/all?block=shikama" className="list-group-item list-group-item-action">
                    色麻町
                </Link>
                <Link href="/map/miyagi/all?block=kami" className="list-group-item list-group-item-action">
                    加美町
                </Link>
                <Link href="/map/miyagi/all?block=wakuya" className="list-group-item list-group-item-action">
                    涌谷町
                </Link>
                <Link href="/map/miyagi/all?block=misato" className="list-group-item list-group-item-action">
                    美里町
                </Link>
                <Link href="/map/miyagi/all?block=onagawa" className="list-group-item list-group-item-action">
                    女川町
                </Link>
                <Link href="/map/miyagi/all?block=minamisanriku" className="list-group-item list-group-item-action">
                    南三陸町
                </Link>
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
