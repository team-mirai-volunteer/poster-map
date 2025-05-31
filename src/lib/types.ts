export interface AreaData {
  area_name: string;
}

export interface PinData {
  lat: number;
  long: number;
  name: string;
  status: number;
  area_id: number;
}

export interface VoteVenue {
  lat: number;
  long: number;
  name: string;
  address: string;
  period: string;
}

export interface ProgressData {
  [key: string]: number;
}

export interface AreaList {
  [key: string]: AreaData;
}