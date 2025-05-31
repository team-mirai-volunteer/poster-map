import { AreaList, ProgressData, VoteVenue, PinData } from './types';

export async function getAreaList(): Promise<AreaList> {
  const response = await fetch('/data/arealist.json');
  return response.json();
}

export async function getProgress(): Promise<ProgressData> {
  const response = await fetch('/data/summary.json');
  return response.json();
}

export async function getProgressCountdown(): Promise<ProgressData> {
  const response = await fetch('/data/summary_absolute.json');
  return response.json();
}

export async function getVoteVenuePins(): Promise<VoteVenue[]> {
  const response = await fetch('/data/vote_venue.json');
  return response.json();
}

export async function getBoardPins(block: string | null = null, smallBlock: string | null = null): Promise<PinData[]> {
  let response;
  if (block === null) {
    response = await fetch('/data/all.json');
  } else {
    response = await fetch(`/data/block/${block}.json`);
  }
  const data: PinData[] = await response.json();

  if (smallBlock === null) {
    return data;
  } else {
    const smallBlockSplit = smallBlock.split('-');
    const areaName = smallBlockSplit[0];
    const smallBlockId = Number(smallBlockSplit[1]);
    const areaList = await getAreaList();
    const areaId = Number(findKeyByAreaName(areaList, areaName));
    return filterDataByAreaIdAndSmallBlock(data, areaId, smallBlockId);
  }
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