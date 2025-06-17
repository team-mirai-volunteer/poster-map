// このレイアウトは、子コンポーネント（この場合はmap/page.tsx）をそのまま表示するだけのシンプルなものです。
// src/app/map/フォルダに専用のlayout.tsxが存在しないため、
// 一つ上の階層であるsrc/app/layout.tsx（トップページと同じレイアウト）が、地図ページにも適用されてしまうことを避けるため、
// 地図ページ専用の、シンプルなレイアウトファイルを作成しています。

// src/app/map/layout.tsx
export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}