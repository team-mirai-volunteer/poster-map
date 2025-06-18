import fs from 'fs';
import path from 'path';
import { PinData, AreaList, VoteVenue, ProgressData } from './types';

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

export function loadJSONData<T>(filePath: string, defaultValue: T): T {
  try {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error(`Error loading JSON from ${filePath}:`, error);
    return defaultValue;
  }
}

export interface PrefectureData {
  pins: PinData[];
  areaList: AreaList;
  progress: ProgressData;
  progressCountdown: ProgressData;
  voteVenues: VoteVenue[];
}

export async function loadPrefectureData(prefecture: string): Promise<PrefectureData> {
  const dataDir = path.join(process.cwd(), 'public', 'data', prefecture);
  
  // Special handling for tokyo-2024
  if (prefecture === 'tokyo-2024') {
    const csvPath = path.join(dataDir, 'board.csv');
    return {
      pins: loadCSVData(csvPath),
      areaList: { 1: { area_name: '東京都' } },
      progress: { total: 0 },
      progressCountdown: { total: 0 },
      voteVenues: []
    };
  }
  
  // For other prefectures, try to load JSON data
  const boardPath = path.join(dataDir, 'board.json');
  const areaListPath = path.join(dataDir, 'arealist.json');
  const progressPath = path.join(dataDir, 'summary.json');
  const progressCountdownPath = path.join(dataDir, 'summary_absolute.json');
  const voteVenuesPath = path.join(dataDir, 'vote_venue.json');
  
  return {
    pins: loadJSONData<PinData[]>(boardPath, []),
    areaList: loadJSONData<AreaList>(areaListPath, {}),
    progress: loadJSONData<ProgressData>(progressPath, { total: 0 }),
    progressCountdown: loadJSONData<ProgressData>(progressCountdownPath, { total: 0 }),
    voteVenues: loadJSONData<VoteVenue[]>(voteVenuesPath, [])
  };
}