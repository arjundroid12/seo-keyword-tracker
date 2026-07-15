import { NextRequest, NextResponse } from 'next/server'
import { tursoQuery } from '@/lib/turso'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const restaurant = await tursoQuery("SELECT * FROM Restaurant WHERE id = ?", [id])
    if (!restaurant.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    const keywords = await tursoQuery("SELECT * FROM Keyword WHERE restaurantId = ? ORDER BY searchVolume DESC", [id])
    // Get ranking history for each keyword
    for (const kw of keywords) {
      kw.rankings = await tursoQuery("SELECT * FROM RankingHistory WHERE keywordId = ? ORDER BY month ASC", [kw.id])
    }
    
    return NextResponse.json({ restaurant: { ...restaurant[0], keywords } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { tursoExecute } = await import('@/lib/turso')
    // Delete keywords first
    await tursoExecute("DELETE FROM RankingHistory WHERE keywordId IN (SELECT id FROM Keyword WHERE restaurantId = ?)", [id])
    await tursoExecute("DELETE FROM Keyword WHERE restaurantId = ?", [id])
    await tursoExecute("DELETE FROM Restaurant WHERE id = ?", [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
