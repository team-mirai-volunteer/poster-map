import { AreaList, ProgressData, VoteVenue, PinData } from './types';

export async function getAreaList(area:string | null = ""): Promise<AreaList> {
  const input = area ? `${area}/` : ""
  try {
    const response = await fetch(`/data/${input}arealist.json`);
    if (!response.ok) throw new Error('AreaList not found');
    return response.json();
  } catch (error) {
    // Return a default area list for tokyo-2024
    if (area === 'tokyo-2024') {
      return {
        1: { area_name: '東京都' }
      };
    }
    throw error;
  }
}

export async function getProgress(area:string | null = ""): Promise<ProgressData> {
  const input = area ? `${area}/` : ""
  try {
    const response = await fetch(`/data/${input}summary.json`);
    if (!response.ok) throw new Error('Progress data not found');
    return response.json();
  } catch (error) {
    if (area === 'tokyo-2024') {
      return { total: 0 };
    }
    throw error;
  }
}

export async function getProgressCountdown(area:string | null = ""): Promise<ProgressData> {
  const input = area ? `${area}/` : ""
  try {
    const response = await fetch(`/data/${input}summary_absolute.json`);
    if (!response.ok) throw new Error('Progress countdown data not found');
    return response.json();
  } catch (error) {
    if (area === 'tokyo-2024') {
      return { total: 0 };
    }
    throw error;
  }
}

export async function getVoteVenuePins(area:string | null = ""): Promise<VoteVenue[]> {
  const input = area ? `${area}/` : ""
  try {
    const response = await fetch(`/data/${input}vote_venue.json`);
    if (!response.ok) throw new Error('Vote venue data not found');
    return response.json();
  } catch (error) {
    if (area === 'tokyo-2024') {
      return [];
    }
    throw error;
  }
}

export async function getBoardPins(block: string | null = null, smallBlock: string | null = null, area:string | null = ""): Promise<PinData[]> {
  const input = area ? `${area}/` : ""
  
  // Load from CSV
  const response = await fetch(`/data/${input}board.csv`);
  
  if (!response.ok) {
    throw new Error('CSV file not found');
  }
  
  const csvText = await response.text();
  const data: PinData[] = parseCSVToPinData(csvText);
  
  if (smallBlock === null) {
    return data;
  } else {
    const smallBlockSplit = smallBlock.split('-');
    const areaName = smallBlockSplit[0];
    const smallBlockId = Number(smallBlockSplit[1]);
    const areaList = await getAreaList(area);
    const areaId = Number(findKeyByAreaName(areaList, areaName));
    return filterDataByAreaIdAndSmallBlock(data, areaId, smallBlockId);
  }
}

function parseCSVToPinData(csvText: string): PinData[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const note = values[5] ? values[5].trim() : null;
    return {
      area_id: 1, // Default area_id for legacy data
      name: values[1],
      lat: parseFloat(values[2]),
      long: parseFloat(values[3]),
      status: parseInt(values[4]),
      note: note === '' ? null : note
    };
  });
}

export function findKeyByAreaName(data: AreaList, areaName: string): string | null {
  for (const key in data) {
    if (data[key].area_name === areaName) {
      return key;
    }
  }
  return null;
}

export function filterDataByAreaIdAndSmallBlock(data: PinData[], areaId: number, smallBlockId: number): PinData[] {
  return data.filter(item => {
    return item.area_id === areaId && item.name.split('-')[0] === String(smallBlockId);
  });
}