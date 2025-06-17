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
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi/kawasaki" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/miyagi" className="list-group-item list-group-item-action">
                    
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
