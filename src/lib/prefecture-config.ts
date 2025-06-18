export interface PrefectureBlock {
  id: string;
  name: string;
  lat?: number;
  long?: number;
  zoom?: number;
}

export interface PrefectureConfig {
  id: string;
  nameJa: string;
  nameEn: string;
  defaultLat: number;
  defaultLong: number;
  defaultZoom: number;
  blocks?: PrefectureBlock[];
}

export const prefectureConfigs: Record<string, PrefectureConfig> = {
  hokkaido: {
    id: 'hokkaido',
    nameJa: '北海道',
    nameEn: 'Hokkaido',
    defaultLat: 43.0642,
    defaultLong: 141.3469,
    defaultZoom: 7,
  },
  miyagi: {
    id: 'miyagi',
    nameJa: '宮城県',
    nameEn: 'Miyagi',
    defaultLat: 38.2688,
    defaultLong: 140.8721,
    defaultZoom: 9,
  },
  saitama: {
    id: 'saitama',
    nameJa: '埼玉県',
    nameEn: 'Saitama',
    defaultLat: 35.8570,
    defaultLong: 139.6489,
    defaultZoom: 10,
  },
  chiba: {
    id: 'chiba',
    nameJa: '千葉県',
    nameEn: 'Chiba',
    defaultLat: 35.6050,
    defaultLong: 140.1233,
    defaultZoom: 9,
  },
  tokyo: {
    id: 'tokyo',
    nameJa: '東京都',
    nameEn: 'Tokyo',
    defaultLat: 35.6762,
    defaultLong: 139.6503,
    defaultZoom: 10,
    blocks: [
      { id: '23-city', name: '23区都心部', lat: 35.6903995, long: 139.7531908, zoom: 13 },
      { id: '23-east', name: '23区東部', lat: 35.7266074, long: 139.8292152, zoom: 14 },
      { id: '23-west', name: '23区南部・西部', lat: 35.6861171, long: 139.6490942, zoom: 13 },
      { id: 'tama-north', name: '多摩北部', lat: 35.7371639, long: 139.4772992, zoom: 13 },
      { id: 'tama-south', name: '多摩南部', lat: 35.6429925, long: 139.5348597, zoom: 13 },
      { id: 'tama-west', name: '多摩西部', lat: 35.7089136, long: 139.2893988, zoom: 12 },
      { id: 'island', name: '島しょ部', lat: 34.0669169, long: 139.3507383, zoom: 13 },
    ],
  },
  kanagawa: {
    id: 'kanagawa',
    nameJa: '神奈川県',
    nameEn: 'Kanagawa',
    defaultLat: 35.4478,
    defaultLong: 139.6425,
    defaultZoom: 10,
  },
  nagano: {
    id: 'nagano',
    nameJa: '長野県',
    nameEn: 'Nagano',
    defaultLat: 36.6513,
    defaultLong: 138.1810,
    defaultZoom: 8,
  },
  aichi: {
    id: 'aichi',
    nameJa: '愛知県',
    nameEn: 'Aichi',
    defaultLat: 35.1802,
    defaultLong: 136.9066,
    defaultZoom: 9,
  },
  osaka: {
    id: 'osaka',
    nameJa: '大阪府',
    nameEn: 'Osaka',
    defaultLat: 34.6864,
    defaultLong: 135.5200,
    defaultZoom: 10,
  },
  hyogo: {
    id: 'hyogo',
    nameJa: '兵庫県',
    nameEn: 'Hyogo',
    defaultLat: 34.6913,
    defaultLong: 135.1831,
    defaultZoom: 9,
  },
  ehime: {
    id: 'ehime',
    nameJa: '愛媛県',
    nameEn: 'Ehime',
    defaultLat: 33.8416,
    defaultLong: 132.7659,
    defaultZoom: 9,
  },
  fukuoka: {
    id: 'fukuoka',
    nameJa: '福岡県',
    nameEn: 'Fukuoka',
    defaultLat: 33.6064,
    defaultLong: 130.4183,
    defaultZoom: 9,
  },
};

export const getPrefectureConfig = (prefectureId: string): PrefectureConfig | undefined => {
  return prefectureConfigs[prefectureId];
};

export const getAllPrefectures = (): PrefectureConfig[] => {
  return Object.values(prefectureConfigs);
};