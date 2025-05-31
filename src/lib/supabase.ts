import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface MapShape {
  id?: string
  type: 'marker' | 'rectangle' | 'polyline' | 'polygon' | 'circle' | 'point' | 'linestring' | 'text'
  coordinates: any
  properties?: any
  created_at?: string
  updated_at?: string
}

export async function saveShape(shape: MapShape) {
  const nowISO = new Date().toISOString();

  const shapeWithMeta: MapShape & { id: string; created_at: string; updated_at: string } = {
    ...shape,
    id:
      shape.id ??
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15)),
    created_at: shape.created_at ?? nowISO,
    updated_at: shape.updated_at ?? nowISO,
  } as any;

  const { data, error } = await supabase
    .from('map_shapes')
    .insert([shapeWithMeta])
    .select()
  
  if (error) {
    console.error('Error saving shape:', error)
    throw error
  }
  
  return data[0]
}

export async function deleteShape(id: string) {
  const { error } = await supabase
    .from('map_shapes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting shape:', error)
    throw error
  }
}

export async function loadShapes() {
  const { data, error } = await supabase
    .from('map_shapes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error loading shapes:', error)
    throw error
  }
  
  return data
}

export async function updateShape(id: string, data: Partial<MapShape>) {
  const { data: rows, error } = await supabase
    .from('map_shapes')
    .update(data)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating shape:', error)
    throw error
  }

  return rows && rows[0]
}
