import fs from 'fs';
import path from 'path';
import { PinData, AreaList, ProgressData } from './types';

export function loadCSVData(filePath: string, areaList: AreaList): PinData[] {
<<<<<<< HEAD

  // エリア名からIDへの逆引きマップを作成
  const areaNameToId = Object.entries(areaList).reduce((acc, [id, area]) => {
    acc[area.area_name] = parseInt(id, 10);
    return acc;
  }, {} as Record<string, number>);

=======
>>>>>>> origin/main
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    return lines.slice(1)
      .map(line => {
        const values = line.split(',');

        if (values.length < 6) {
          console.warn(`Invalid CSV line: ${line}`);
          return undefined;
        }
        const area_id = areaNameToId[values[0].trim()];
        if (area_id === undefined) {
          return undefined;
        }

        if (isNaN(area_id)) {
          console.warn(`Invalid area_id: ${area_id}`);
          return undefined;
        }

        return {
          area_id,
          name: values[1].trim(),
          lat: parseFloat(values[2]),
          long: parseFloat(values[3]),
          status: parseInt(values[4], 10),
        };

    }).filter((item): item is PinData => item !== undefined);

  } catch (error) {
    console.error(`Error loading CSV from ${filePath}:`, error);
    return [];
  }
}

export function loadArealist(filePath:string): AreaList{
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    const areaList: AreaList = lines.slice(1).reduce((acc, line) => {
      const values = line.split(',');
<<<<<<< HEAD

      // CSV列数の検証
      if (values.length < 2) {
        console.warn(`Invalid arealist CSV line: ${line}`);
        return acc;
      }

=======
>>>>>>> origin/main
      acc[values[0]] = { area_name: values[1] };
      return acc;
    }, {} as AreaList);

    return areaList;

  } catch (error) {
    console.error(`Error loading CSV from ${filePath}:`, error);
    return {};
  }
}

export interface PrefectureData {
  pins: PinData[];
  areaList: AreaList;
  progress: ProgressData;
  progressCountdown: ProgressData;
}

export async function loadPrefectureData(prefecture: string): Promise<PrefectureData> {
  const dataDir = path.join(process.cwd(), 'src', 'data', prefecture);
  const csvPath = path.join(dataDir, 'board.csv');
  const arealist = path.join(dataDir, 'arealist.csv');
  const areaList = loadArealist(arealist)
  // Load only CSV data
  return {
    areaList: areaList,
    pins: loadCSVData(csvPath,areaList),
    progress: { total: 0 },
    progressCountdown: { total: 0 }
  };
}