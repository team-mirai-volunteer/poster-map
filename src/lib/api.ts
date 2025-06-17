import { supabase } from './supabaseClient';
import { PinData } from './types';

/**
 * Supabaseからポスター掲示場のピン情報を取得します。
 * 都道府県名で絞り込むことも可能です。
 * @param prefecture - 絞り込みたい都道府県名（例：「東京都」）。nullの場合は全件取得。
 * @returns ピン情報の配列
 */
export async function getBoardPins(prefecture: string | null): Promise<PinData[]> {
  let query = supabase
    .from('pins')
    .select(`
      id,
      number,
      address,
      place_name,
      lat,
      long,
      status,
      note,
      cities (
        prefecture,
        city
      )
    `);

  // もしprefectureがURLで指定されていたら、それでデータを絞り込む
  if (prefecture) {
    // 【修正点】関連テーブル(cities)の列で絞り込む際の、Supabaseの正しい書き方
    query = query.filter('cities.prefecture', 'eq', prefecture);
  }

  const { data, error } = await query;

  if (error) {
    // エラーオブジェクトを詳しくコンソールに出力すると、デバッグがしやすくなります
    console.error('Error fetching pins:', JSON.stringify(error, null, 2));
    return [];
  }

  if (!data) {
    return [];
  }
  
  // Supabaseからのデータ構造を、PinData型に合うように整形する
  const formattedData = data.map(pin => {
    const cityInfo = Array.isArray(pin.cities) && pin.cities.length > 0 
      ? pin.cities[0] 
      : { prefecture: '不明', city: '不明' }; 

    return {
      ...pin,
      cities: cityInfo,
    };
  });

  return formattedData as PinData[];
}

/**
 * 特定のピンのステータスと備考を更新します。
 * @param id - 更新したいピンのID
 * @param status - 新しいステータス番号
 * @param note - 新しい備考テキスト
 * @returns 更新されたピンの情報
 */
export async function updatePin(id: number, status: number, note: string) {
  const { data, error } = await supabase
    .from('pins')
    .update({ status: status, note: note })
    .eq('id', id)
    .select(`*, cities(prefecture, city)`) // 更新後もcitiesの情報を取得する
    .single();

  if (error) {
    console.error('Error updating pin:', error);
    throw error;
  }

  if (!data) {
    throw new Error("Pin not found after update.");
  }
  
  // updatePinでも同様にデータ構造を整形する
  const cityInfo = Array.isArray(data.cities) && data.cities.length > 0
    ? data.cities[0]
    : { prefecture: '不明', city: '不明' };

  const formattedData = {
    ...data,
    cities: cityInfo,
  };
  
  return formattedData as PinData;
}