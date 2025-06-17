export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* <h1>...</h1> を削除 */}
        {children}
      </body>
    </html>
  );
}
