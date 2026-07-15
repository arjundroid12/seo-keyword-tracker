import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { accessToken, siteUrl } = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
    }

    // Step 1: Get list of sites in Search Console
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!sitesRes.ok) {
      const err = await sitesRes.text()
      return NextResponse.json({ error: `Search Console API error: ${err.slice(0, 200)}` }, { status: 400 })
    }

    const sitesData = await sitesRes.json()
    const sites = sitesData.siteEntry || []

    if (sites.length === 0) {
      return NextResponse.json({
        keywords: [],
        message: 'No sites found in Google Search Console. Add your website to Search Console first.',
      })
    }

    // Use the first site (or match if siteUrl provided)
    const targetSite = siteUrl
      ? sites.find((s: any) => s.siteUrl.includes(siteUrl)) || sites[0]
      : sites[0]

    // Step 2: Get search analytics (real keywords, impressions, clicks, positions)
    const today = new Date()
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1)
    const startDate = threeMonthsAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]

    const analyticsRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(targetSite.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 100,
        }),
      }
    )

    if (!analyticsRes.ok) {
      const err = await analyticsRes.text()
      return NextResponse.json({ error: `Search analytics error: ${err.slice(0, 200)}` }, { status: 400 })
    }

    const analyticsData = await analyticsRes.json()
    const rows = analyticsData.rows || []

    // Format the real data
    const realKeywords = rows.map((row: any) => ({
      keyword: row.keys[0],
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: Math.round(row.ctr * 1000) / 10, // percentage with 1 decimal
      position: Math.round(row.position * 10) / 10, // 1 decimal
    }))

    // Sort by impressions (most searched first)
    realKeywords.sort((a: any, b: any) => b.impressions - a.impressions)

    return NextResponse.json({
      site: targetSite.siteUrl,
      totalKeywords: realKeywords.length,
      keywords: realKeywords.slice(0, 50), // Top 50 keywords
    })
  } catch (error: any) {
    console.error('Search Console error:', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
