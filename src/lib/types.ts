// src/lib/types.ts (修正版)

export interface PinData {
  id: number;
  number: string;
  address: string;
  place_name: string;
  lat: number | null;
  long: number | null;
  status: number;
  note: string | null;
  // citiesテーブルからJOINしたデータ用の型を追加
  cities: {
    prefecture: string;
    city: string;
  } | null;
}
