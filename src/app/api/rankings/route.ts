import { NextRequest, NextResponse } from 'next/server'
import { tursoQuery, tursoExecute, genId, now } from '@/lib/turso'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { restaurantId, month, rankings } = await req.json()
    if (!restaurantId || !month || !rankings) {
      return NextResponse.json({ error: 'restaurantId, month, and rankings required' }, { status: 400 })
    }

    for (const r of rankings) {
      const existing = await tursoQuery("SELECT * FROM RankingHistory WHERE keywordId = ? AND month = ?", [r.keywordId, month])
      if (existing.length > 0) {
        await tursoExecute("UPDATE RankingHistory SET organicRanking = ?, gbpRanking = ? WHERE keywordId = ? AND month = ?", [
          r.organicRanking ?? null, r.gbpRanking ?? null, r.keywordId, month
        ])
      } else {
        await tursoExecute("INSERT INTO RankingHistory (id, keywordId, month, organicRanking, gbpRanking, createdAt) VALUES (?, ?, ?, ?, ?, ?)", [
          genId(), r.keywordId, month, r.organicRanking ?? null, r.gbpRanking ?? null, now()
        ])
      }
      // Update keyword's current ranking
      await tursoExecute("UPDATE Keyword SET organicRanking = ?, gbpRanking = ?, updatedAt = ? WHERE id = ?", [
        r.organicRanking ?? null, r.gbpRanking ?? null, now(), r.keywordId
      ])
    }

    return NextResponse.json({ saved: rankings.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

    const keywords = await tursoQuery("SELECT * FROM Keyword WHERE restaurantId = ? ORDER BY searchVolume DESC", [restaurantId])
    const months = new Set<string>()
    for (const kw of keywords) {
      kw.rankings = await tursoQuery("SELECT * FROM RankingHistory WHERE keywordId = ? ORDER BY month ASC", [kw.id])
      kw.rankings.forEach((r: any) => months.add(r.month))
    }
    return NextResponse.json({ keywords, months: Array.from(months).sort() })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
