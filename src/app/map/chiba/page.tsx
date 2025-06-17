import Link from 'next/link'

export default function ChibaPage() {
    return (
    <div className="container-sm my-5">
        <div className="col-lg-12 px-0">
            <h3 className="mb-4">チームみらいマップ 千葉県</h3>
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
                <Link href="/map/chiba/all" className="list-group-item list-group-item-action">
                    千葉県全域
                </Link>
                <Link href="/map/chiba?block=23-city" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/chiba?block=23-east" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/chiba?block=23-west" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/chiba?block=tama-north" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/chiba?block=tama-south" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/chiba?block=tama-west" className="list-group-item list-group-item-action">
                    
                </Link>
                <Link href="/map/chiba?block=island" className="list-group-item list-group-item-action">
                    
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
