import Link from 'next/link';

const regions = [
  { name: '北海道・東北', prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { name: '関東', prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  { name: '中部', prefectures: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'] },
  { name: '近畿', prefectures: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  { name: '中国・四国', prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'] },
  { name: '九州・沖縄', prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'] }
];

export default function HomePage() {
  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '960px', margin: 'auto' }}>
      {/* <h1 style={{ textAlign: 'center' }}>チームみらいマップ</h1> ← この行はlayout.tsxに移動 */}
      <section>
        <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>参議院選挙</h2>
        {regions.map((region) => (
          <div key={region.name} style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '16px 0', borderLeft: '4px solid #0070f3', paddingLeft: '12px' }}>
              {region.name}
            </h3>
            <ul style={{ 
              listStyle: 'none', padding: 0, display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px'
            }}>
              {region.prefectures.map((pref) => (
                <li key={pref}>
                  <Link 
                    href={`/map?prefecture=${encodeURIComponent(pref)}`} 
                    style={{ textDecoration: 'none', color: '#0070f3', fontSize: '1rem' }}
                  >
                    {pref}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <hr style={{ margin: '20px 0' }} />
      <Link href="/posting">posting</Link><br />
      <a href="https://team-mir.ai/">チームみらい 公式ホームページ</a>
    </main>
  );
}
