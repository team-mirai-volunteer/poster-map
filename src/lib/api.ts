import { ProgressData, PinData } from './types';

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

export async function getBoardPins(block: string | null = null, smallBlock: string | null = null, area:string | null = ""): Promise<PinData[]> {
  const input = area ? `${area}/` : ""
  
  // Load from CSV
  const response = await fetch(`/data/${input}board.csv`);
  
  if (!response.ok) {
    throw new Error('CSV file not found');
  }
  
  const csvText = await response.text();
  const data: PinData[] = parseCSVToPinData(csvText);
  
  return data;
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

