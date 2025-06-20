import fs from 'fs';
import path from 'path';
import { PinData, AreaList, ProgressData } from './types';

export function loadCSVData(filePath: string): PinData[] {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const note = values[5] ? values[5].trim() : null;
      return {
        area_id: 1,
        name: values[1],
        lat: parseFloat(values[2]),
        long: parseFloat(values[3]),
        status: parseInt(values[4]),
        note: note === '' ? null : note
      };
    });
  } catch (error) {
    console.error(`Error loading CSV from ${filePath}:`, error);
    return [];
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
  
  // Load only CSV data
  return {
    pins: loadCSVData(csvPath),
    areaList: {},
    progress: { total: 0 },
    progressCountdown: { total: 0 }
  };
}