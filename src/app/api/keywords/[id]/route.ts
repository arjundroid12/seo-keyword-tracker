import { NextRequest, NextResponse } from 'next/server'
import { tursoExecute } from '@/lib/turso'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { organicRanking, gbpRanking } = await req.json()
    await tursoExecute("UPDATE Keyword SET organicRanking = ?, gbpRanking = ?, updatedAt = ? WHERE id = ?", [
      organicRanking ?? null, gbpRanking ?? null, new Date().toISOString(), id
    ])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
