import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface MapShape {
  id?: string
  type: 'marker' | 'rectangle' | 'polyline' | 'polygon' | 'circle' | 'point' | 'linestring'
  coordinates: any
  properties?: any
  created_at?: string
  updated_at?: string
}

export async function saveShape(shape: MapShape) {
  const { data, error } = await supabase
    .from('map_shapes')
    .insert([shape])
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
