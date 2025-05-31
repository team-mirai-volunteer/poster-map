import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export interface MapShapeData {
  id?: string
  type: 'marker' | 'rectangle' | 'polyline' | 'polygon' | 'circle' | 'point' | 'linestring'
  coordinates: any
  properties?: any
}

export async function saveMapShape(shape: MapShapeData) {
  const result = await prisma.mapShape.create({
    data: {
      type: shape.type,
      coordinates: shape.coordinates,
      properties: shape.properties || {}
    }
  })
  return result
}

export async function deleteMapShape(id: string) {
  await prisma.mapShape.delete({
    where: { id }
  })
}

export async function loadMapShapes() {
  const shapes = await prisma.mapShape.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return shapes
}

export async function updateMapShape(id: string, data: Partial<MapShapeData>) {
  const result = await prisma.mapShape.update({
    where: { id },
    data: {
      ...(data.type && { type: data.type }),
      ...(data.coordinates && { coordinates: data.coordinates }),
      ...(data.properties && { properties: data.properties })
    }
  })
  return result
}