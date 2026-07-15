import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const REDIRECT_URI = 'https://seo-keyword-tracker-gules.vercel.app/api/auth/google'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const restaurantId = searchParams.get('state')

  // Step 1: Redirect to Google OAuth consent screen
  if (!code && !error) {
    const scope = encodeURIComponent([
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ].join(' '))

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${restaurantId || ''}`

    return NextResponse.redirect(authUrl)
  }

  // Step 2: Handle error from Google
  if (error) {
    return NextResponse.redirect(`https://seo-keyword-tracker-gules.vercel.app/?google_error=${encodeURIComponent(error)}`)
  }

  // Step 3: Exchange code for tokens
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code!,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('Token exchange error:', errText)
      return NextResponse.redirect(`https://seo-keyword-tracker-gules.vercel.app/?google_error=token_failed`)
    }

    const tokens = await tokenRes.json()

    // Redirect back to the app with tokens in URL (for now — in production, store in DB)
    // We'll pass the access token and restaurant ID back to the frontend
    const redirectUrl = `https://seo-keyword-tracker-gules.vercel.app/?google_connected=1&restaurant_id=${restaurantId || ''}#tokens=${encodeURIComponent(JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
    }))}`

    return NextResponse.redirect(redirectUrl)
  } catch (err: any) {
    console.error('OAuth error:', err)
    return NextResponse.redirect(`https://seo-keyword-tracker-gules.vercel.app/?google_error=exception`)
  }
}
