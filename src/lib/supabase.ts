import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During static build (or if env vars missing) we defer initialisation.
    // Functions that rely on Supabase will throw a descriptive error on the client instead of at build time.
    throw new Error('Supabase environment variables are not defined');
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

export interface MapShape {
  id?: string
  type: 'marker' | 'rectangle' | 'polyline' | 'polygon' | 'circle' | 'point' | 'linestring'
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

  const client = getSupabase();
  const { data, error } = await client
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
  const client = getSupabase();
  const { error } = await client
    .from('map_shapes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting shape:', error)
    throw error
  }
}

export async function loadShapes() {
  const client = getSupabase();
  const { data, error } = await client
    .from('map_shapes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error loading shapes:', error)
    throw error
  }
  
  return data
}
