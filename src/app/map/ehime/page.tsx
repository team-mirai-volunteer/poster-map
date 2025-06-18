import Link from 'next/link'

export default function EhimePage() {
    return (
    <div className="container-sm my-5">
        <div className="col-lg-12 px-0">
            <h3 className="mb-4">チームみらいマップ 愛媛県</h3>
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
                <Link href="/map/ehime/all" className="list-group-item list-group-item-action">
                    愛媛県全域
                </Link>
                <Link href="/map/ehime/all?block=matsuyama" className="list-group-item list-group-item-action">
                    松山市
                </Link>
                <Link href="/map/ehime/all?block=imabari" className="list-group-item list-group-item-action">
                    今治市
                </Link>
                <Link href="/map/ehime/all?block=uwajima" className="list-group-item list-group-item-action">
                    宇和島市
                </Link>
                <Link href="/map/ehime/all?block=yawatahama" className="list-group-item list-group-item-action">
                    八幡浜市
                </Link>
                <Link href="/map/ehime/all?block=niihama" className="list-group-item list-group-item-action">
                    新居浜市
                </Link>
                <Link href="/map/ehime/all?block=saijo" className="list-group-item list-group-item-action">
                    西条市
                </Link>
                <Link href="/map/ehime/all?block=ozu" className="list-group-item list-group-item-action">
                    大洲市
                </Link>
                <Link href="/map/ehime/all?block=iyo" className="list-group-item list-group-item-action">
                    伊予市
                </Link>
                <Link href="/map/ehime/all?block=shikokuchuo" className="list-group-item list-group-item-action">
                    四国中央市
                </Link>
                <Link href="/map/ehime/all?block=seiyo" className="list-group-item list-group-item-action">
                    西予市
                </Link>
                <Link href="/map/ehime/all?block=toon" className="list-group-item list-group-item-action">
                    東温市
                </Link>
                <Link href="/map/ehime/all?block=kamijima" className="list-group-item list-group-item-action">
                    上島町
                </Link>
                <Link href="/map/ehime/all?block=kumakogen" className="list-group-item list-group-item-action">
                    久万高原町
                </Link>
                <Link href="/map/ehime/all?block=masaki" className="list-group-item list-group-item-action">
                    松前町
                </Link>
                <Link href="/map/ehime/all?block=tobe" className="list-group-item list-group-item-action">
                    砥部町
                </Link>
                <Link href="/map/ehime/all?block=uchiko" className="list-group-item list-group-item-action">
                    内子町
                </Link>
                <Link href="/map/ehime/all?block=ikata" className="list-group-item list-group-item-action">
                    伊方町
                </Link>
                <Link href="/map/ehime/all?block=ainan" className="list-group-item list-group-item-action">
                    愛南町
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
