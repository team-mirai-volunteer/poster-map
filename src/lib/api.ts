import { AreaList, ProgressData, VoteVenue, PinData } from './types';

export async function getAreaList(area:string | null = ""): Promise<AreaList> {
  const input = area ? `${area}/` : ""
  const response = await fetch(`/data/${input}arealist.json`);
  return response.json();
}

export async function getProgress(area:string | null = ""): Promise<ProgressData> {
  const input = area ? `${area}/` : ""
  const response = await fetch(`/data/${input}summary.json`);
  return response.json();
}

export async function getProgressCountdown(area:string | null = ""): Promise<ProgressData> {
  const input = area ? `${area}/` : ""
  const response = await fetch(`/data/${input}summary_absolute.json`);
  return response.json();
}

export async function getVoteVenuePins(area:string | null = ""): Promise<VoteVenue[]> {
  const input = area ? `${area}/` : ""
  const response = await fetch(`/data/${input}vote_venue.json`);
  return response.json();
}

export async function getBoardPins(block: string | null = null, smallBlock: string | null = null, area:string | null = ""): Promise<PinData[]> {
  const input = area ? `${area}/` : ""
  let response;
  if (block === null) {
    response = await fetch(`/data/${input}all.json`);
  } else {
    response = await fetch(`/data/${input}block/${block}.json`);
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