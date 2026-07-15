import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
    }

    // Step 1: Get list of GA4 properties
    const propertiesRes = await fetch(
      'https://analyticsdata.googleapis.com/v1beta/properties?page_size=100',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!propertiesRes.ok) {
      const err = await propertiesRes.text()
      // 404 = no GA4 properties found (common if site uses old Universal Analytics)
      if (propertiesRes.status === 404) {
        return NextResponse.json({
          message: 'No GA4 properties found. This website may use older Universal Analytics (UA) instead of GA4, or Analytics is not set up. To get real traffic data, set up Google Analytics 4 at analytics.google.com.',
          metrics: null,
        })
      }
      return NextResponse.json({ error: `Analytics API error: ${propertiesRes.status} — ${err.slice(0, 200)}` }, { status: 400 })
    }

    const propertiesData = await propertiesRes.json()
    const properties = propertiesData.properties || []

    if (properties.length === 0) {
      return NextResponse.json({
        message: 'No GA4 properties found. Set up Google Analytics 4 for your website at analytics.google.com to see real traffic data.',
        metrics: null,
      })
    }

    // Use first property
    const property = properties[0]
    const propertyId = property.name.split('/')[1]

    // Step 2: Get real traffic data (last 28 days)
    const today = new Date()
    const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)

    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: startDate.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        }),
      }
    )

    if (!reportRes.ok) {
      const err = await reportRes.text()
      return NextResponse.json({ error: `Analytics report error: ${err.slice(0, 200)}` }, { status: 400 })
    }

    const reportData = await reportRes.json()
    const rows = reportData.rows || []

    // Build traffic by source
    const trafficBySource = rows.map((row: any) => ({
      source: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0,
      pageViews: parseInt(row.metricValues[2].value) || 0,
    }))

    // Total metrics
    const totalUsers = trafficBySource.reduce((s: number, r: any) => s + r.users, 0)
    const totalSessions = trafficBySource.reduce((s: number, r: any) => s + r.sessions, 0)
    const totalPageViews = trafficBySource.reduce((s: number, r: any) => s + r.pageViews, 0)

    return NextResponse.json({
      property: property.displayName || property.name,
      metrics: {
        totalUsers,
        totalSessions,
        totalPageViews,
        trafficBySource,
      },
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
