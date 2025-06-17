import Link from 'next/link'

export default function KanagawaPage() {
    return (
    <div className="container-sm my-5">
        <div className="col-lg-12 px-0">
            <h3 className="mb-4">チームみらいマップ 神奈川県</h3>
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
                <Link href="/map/kanagawa/all" className="list-group-item list-group-item-action">
                    神奈川県全域
                </Link>
                <Link href="/map/kanagawa/all?block=yokohama" className="list-group-item list-group-item-action">
                    横浜市
                </Link>
                <Link href="/map/kanagawa/all?block=kawasaki" className="list-group-item list-group-item-action">
                    川崎市
                </Link>
                <Link href="/map/kanagawa/all?block=sagamihara" className="list-group-item list-group-item-action">
                    相模原市
                </Link>
                <Link href="/map/kanagawa/all?block=yokosuka" className="list-group-item list-group-item-action">
                    横須賀市
                </Link>
                <Link href="/map/kanagawa/all?block=hiratuka" className="list-group-item list-group-item-action">
                    平塚市
                </Link>
                <Link href="/map/kanagawa/all?block=kamakura" className="list-group-item list-group-item-action">
                    鎌倉市
                </Link>
                <Link href="/map/kanagawa/all?block=fujisawa" className="list-group-item list-group-item-action">
                    藤沢市
                </Link>
                <Link href="/map/kanagawa/all?block=odawara" className="list-group-item list-group-item-action">
                    小田原市
                </Link>
                <Link href="/map/kanagawa/all?block=chigasaki" className="list-group-item list-group-item-action">
                    茅ヶ崎市
                </Link>
                <Link href="/map/kanagawa/all?block=zushi" className="list-group-item list-group-item-action">
                    逗子市
                </Link>
                <Link href="/map/kanagawa/all?block=miura" className="list-group-item list-group-item-action">
                    三浦市
                </Link>
                <Link href="/map/kanagawa/all?block=hadano" className="list-group-item list-group-item-action">
                    秦野市
                </Link>
                <Link href="/map/kanagawa/all?block=atugi" className="list-group-item list-group-item-action">
                    厚木市
                </Link>
                <Link href="/map/kanagawa/all?block=yamato" className="list-group-item list-group-item-action">
                    大和市
                </Link>
                <Link href="/map/kanagawa/all?block=isehara" className="list-group-item list-group-item-action">
                    伊勢原市
                </Link>
                <Link href="/map/kanagawa/all?block=ebina" className="list-group-item list-group-item-action">
                    海老名市
                </Link>
                <Link href="/map/kanagawa/all?block=zama" className="list-group-item list-group-item-action">
                    座間市
                </Link>
                <Link href="/map/kanagawa/all?block=minamiashigara" className="list-group-item list-group-item-action">
                    南足柄市
                </Link>
                <Link href="/map/kanagawa/all?block=ayase" className="list-group-item list-group-item-action">
                    綾瀬市
                </Link>
                <Link href="/map/kanagawa/all?block=hayama" className="list-group-item list-group-item-action">
                    三浦郡葉山町
                </Link>
                <Link href="/map/kanagawa/all?block=samukawa" className="list-group-item list-group-item-action">
                    高座郡寒川町
                </Link>
                <Link href="/map/kanagawa/all?block=oiso" className="list-group-item list-group-item-action">
                    中郡大磯町
                </Link>
                <Link href="/map/kanagawa/all?block=ninomiya" className="list-group-item list-group-item-action">
                    中郡二宮町
                </Link>
                <Link href="/map/kanagawa/all?block=nakai" className="list-group-item list-group-item-action">
                    足柄上郡中井町
                </Link>
                <Link href="/map/kanagawa/all?block=ohi" className="list-group-item list-group-item-action">
                    足柄上郡大井町
                </Link>
                <Link href="/map/kanagawa/all?block=matuda" className="list-group-item list-group-item-action">
                    足柄上郡松田町
                </Link>
                <Link href="/map/kanagawa/all?block=yamakita" className="list-group-item list-group-item-action">
                    足柄上郡山北町
                </Link>
                <Link href="/map/kanagawa/all?block=kaisei" className="list-group-item list-group-item-action">
                    足柄上郡開成町
                </Link>
                <Link href="/map/kanagawa/all?block=hakone" className="list-group-item list-group-item-action">
                    足柄下郡箱根町
                </Link>
                <Link href="/map/kanagawa/all?block=manazuru" className="list-group-item list-group-item-action">
                    足柄下郡真鶴町
                </Link>
                <Link href="/map/kanagawa/all?block=yugawara" className="list-group-item list-group-item-action">
                    足柄下郡湯河原町
                </Link>
                <Link href="/map/kanagawa/all?block=aikawa" className="list-group-item list-group-item-action">
                    愛甲郡愛川町
                </Link>
                <Link href="/map/kanagawa/all?block=kiyokawa" className="list-group-item list-group-item-action">
                    愛甲郡清川村
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
