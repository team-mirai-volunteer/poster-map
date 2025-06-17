export function getStatusText(status: number): string {
  const statusDict: { [key: number]: string } = {
    0: "未",
    1: "完了", 
    2: "異常",
    3: "予約",
    4: "要確認",
    5: "異常対応中",
    6: "削除",
    7: "貼り付け確認完了",//追加
  };
  return statusDict[status] || "不明";
}

export function getStatusColor(status: number): string {
  switch (status) {
    case 0: // 未
      return '#3498DB'; // 青
    case 1: // 完了
      return '#2ECC71'; // 緑
    case 7: // 貼り付け確認完了
      return '#F4D03F'; // 黄色
    case 2: // 異常
      return '#E74C3C'; // 赤
    case 4: // 要確認
      return '#F39C12'; // オレンジ
    case 5: // 異常対応中
      return '#9B59B6'; // 紫
    case 6: // 削除
      return '#95A5A6'; // グレー
    default:
      return '#FFFFFF'; // 不明な場合は白
  }
}

export function createProgressBox(L: any, progressValue: number, position: string) {
  const control = new L.Control({ position });
  control.onAdd = function () {
    const div = L.DomUtil.create('div', 'info progress');
    div.innerHTML += '<p>完了率 (全域)</p>';
    div.innerHTML += `<p><span class="progressValue">${progressValue}</span>%</p>`;
    return div;
  };
  return control;
}

export function createProgressBoxCountdown(L: any, progressValue: number, position: string) {
  const control = new L.Control({ position });
  control.onAdd = function () {
    const div = L.DomUtil.create('div', 'info progress');
    div.innerHTML += '<p>残り</p>';
    div.innerHTML += `<p><span class="progressValue">${progressValue}</span>ヶ所</p>`;
    return div;
  };
  return control;
}

export function createGrayIcon(L: any) {
  return L.icon({
    iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
    iconSize: [20, 32.8],
    popupAnchor: [1, -10],
    shadowSize: [32.8, 32.8],
    className: "icon-gray",
  });
}

export function createBaseLayers(L: any) {
  return {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    googleMap: L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 18,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google'
    }),
    japanBaseMap: L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
    })
  };
}