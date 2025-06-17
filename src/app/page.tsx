import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>チームみらいマップ</h1>

      <section>
        <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>参議院選挙</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ margin: '10px 0' }}>
            <Link href="/map?prefecture=東京都" style={{ textDecoration: 'none', color: '#0070f3', fontSize: '1.2rem' }}>
              東京都
            </Link>
          </li>
          {/* 今後、他の都道府県のリンクもここに追加できる */}
        </ul>
      </section>

      <hr style={{ margin: '20px 0' }} />

      {/* postingページへのリンクは残しておく */}
      <Link href="/posting">posting</Link><br />
      <a href="https://team-mir.ai/">チームみらい 公式ホームページ</a>
    </main>
  );
}
