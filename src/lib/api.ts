import { supabase } from './supabaseClient';
import { PinData } from './types'; 

/**
 * Supabaseからポスター掲示場のピン情報を取得します。
 * 都道府県名で絞り込むことも可能です。
 * @param prefecture - 絞り込みたい都道府県名（例：「東京都」）。nullの場合は全件取得。
 * @returns ピン情報の配列
 */
// src/lib/api.ts に貼り付ける新しい getBoardPins 関数

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

  if (prefecture) {
    query = query.eq('cities.prefecture', prefecture);
  }

  // データ取得を実行
  const { data: rawData, error } = await query;

  if (error) {
    // エラーオブジェクトの中身を詳しく表示させるように変更
    console.error('Error fetching pins:', JSON.stringify(error, null, 2)); // ← このように書き換える
    return []; 
  }
  
  if (!rawData) {
    return []; // データがnullの場合も空配列を返す
  }

  // SupabaseからのデータをPinData型に合うように整形する
  const formattedData: PinData[] = rawData.map(pin => {
    // Supabaseから返されるcitiesは配列なので、その最初の要素を取得します。
    // (pinsテーブルとcitiesテーブルは1対1の関係と想定)
    const cityInfo = Array.isArray(pin.cities) && pin.cities.length > 0
      ? pin.cities[0]
      : null;

    return {
      id: pin.id,
      number: pin.number,
      address: pin.address,
      place_name: pin.place_name,
      lat: pin.lat,
      long: pin.long,
      status: pin.status,
      note: pin.note,
      cities: cityInfo, // 整形したオブジェクトをセット
    };
  });

  return formattedData;
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
    .eq('id', id) // idが一致する行を更新
    .select()
    .single(); // 更新した1件だけを返す

  if (error) {
    console.error('Error updating pin:', error);
    throw error;
  }
  return data;
}
