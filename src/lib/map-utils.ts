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
    case 0:
      return '#0288D1';
    case 1:
      return '#FFD600';
    case 2:
      return '#E65100';
    case 3:
      return '#0F9D58';
    case 4:
      return '#FF9706';
    case 5:
      return '#9106E9';
    case 6:
      return '#FFD600';
    case 7://追加
      return '#FFD700';

    default:
      return '#666666';
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