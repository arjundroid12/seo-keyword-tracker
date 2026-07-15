'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  Search, Sparkles, Trash2, Download, ExternalLink, TrendingUp, TrendingDown,
  BarChart3, AlertCircle, CheckCircle2, Loader2, ChevronRight, Globe,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine,
} from 'recharts'

// ============ TYPES ============
type Keyword = {
  id: string
  keyword: string
  searchVolume: number
  difficulty: number
  organicRanking: number | null
  gbpRanking: number | null
  dataSource: 'google_real' | 'ai_estimate'
  rankings?: { month: string; organicRanking: number | null; gbpRanking: number | null }[]
}

type Restaurant = {
  id: string
  name: string
  location: string
  website: string | null
  cuisine: string | null
  createdAt: string
  keywordCount?: number
  keywords?: Keyword[]
}

type DataSources = {
  googleAutocomplete?: { count: number; data: string[]; type: string }
  pageSpeed?: { performance: number; seo: number; accessibility: number; issues: string[]; type: string } | null
  aiEstimates?: { count: number; type: string }
}

type GoogleTokens = {
  access_token: string
  refresh_token?: string
  expires_in: number
}

// ============ MAIN COMPONENT ============
export default function Home() {
  const { toast } = useToast()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [generating, setGenerating] = useState(false)

  // Result state
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null)
  const [currentDataSources, setCurrentDataSources] = useState<DataSources | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editOrganic, setEditOrganic] = useState('')
  const [editGbp, setEditGbp] = useState('')

  // Google OAuth state
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null)
  const [googleConnecting, setGoogleConnecting] = useState(false)
  const [searchConsoleData, setSearchConsoleData] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Bulk import state
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Compare state
  const [compareOpen, setCompareOpen] = useState(false)

  // Filter state
  const [filterSource, setFilterSource] = useState<'all' | 'google_real' | 'ai_estimate'>('all')
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'organic' | 'gbp'>('volume')

  const initialized = useRef(false)

  // ============ Load restaurants list on mount ============
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    loadRestaurants()

    // Check for Google OAuth callback in URL
    const url = new URL(window.location.href)
    const connected = url.searchParams.get('google_connected')
    const error = url.searchParams.get('google_error')
    const restaurantId = url.searchParams.get('restaurant_id')
    const hash = window.location.hash
    if (connected === '1' && hash.includes('tokens=')) {
      try {
        const tokensStr = decodeURIComponent(hash.split('tokens=')[1])
        const tokens = JSON.parse(tokensStr)
        setGoogleTokens(tokens)
        toast({
          title: 'Google connected',
          description: 'You can now fetch real Search Console and Analytics data.',
        })
        if (restaurantId) {
          loadRestaurant(restaurantId)
        }
        // Clean URL
        window.history.replaceState({}, document.title, '/')
      } catch {
        toast({ title: 'Google connection failed', variant: 'destructive' })
      }
    }
    if (error) {
      toast({
        title: 'Google connection failed',
        description: error === 'token_failed' ? 'Token exchange failed.' : 'Authorization was cancelled or failed.',
        variant: 'destructive',
      })
      window.history.replaceState({}, document.title, '/')
    }
  }, [toast])

  const loadRestaurants = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/restaurants')
      const data = await res.json()
      if (data.restaurants) setRestaurants(data.restaurants)
    } catch (e: any) {
      toast({ title: 'Failed to load restaurants', description: e.message, variant: 'destructive' })
    } finally {
      setLoadingList(false)
    }
  }, [toast])

  const loadRestaurant = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/restaurants/${id}`)
      const data = await res.json()
      if (data.restaurant) {
        setCurrentRestaurant(data.restaurant)
        setCurrentDataSources(null)
        setShowResults(true)
      }
    } catch (e: any) {
      toast({ title: 'Failed to load restaurant', description: e.message, variant: 'destructive' })
    }
  }, [toast])

  // ============ Generate keywords ============
  const handleGenerate = async () => {
    if (!name.trim() || !location.trim()) {
      toast({ title: 'Required fields missing', description: 'Restaurant name and location are required.', variant: 'destructive' })
      return
    }
    setGenerating(true)
    setShowResults(false)
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          website: website.trim() || undefined,
          cuisine: cuisine.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate keywords')

      setCurrentRestaurant(data.restaurant)
      setCurrentDataSources(data.dataSources || null)
      setShowResults(true)
      await loadRestaurants()
      toast({
        title: 'Keywords generated',
        description: `${data.restaurant.keywords?.length || 30} keywords for ${data.restaurant.name}`,
      })
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  // ============ Delete restaurant ============
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its keywords? This cannot be undone.`)) return
    try {
      await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
      if (currentRestaurant?.id === id) {
        setCurrentRestaurant(null)
        setShowResults(false)
      }
      await loadRestaurants()
      toast({ title: 'Deleted', description: `"${name}" was removed.` })
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' })
    }
  }

  // ============ Save ranking edit ============
  const handleSaveEdit = async (keywordId: string) => {
    try {
      const organic = editOrganic === '' ? null : Number(editOrganic)
      const gbp = editGbp === '' ? null : Number(editGbp)
      await fetch(`/api/keywords/${keywordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organicRanking: organic, gbpRanking: gbp }),
      })
      if (currentRestaurant) {
        setCurrentRestaurant({
          ...currentRestaurant,
          keywords: currentRestaurant.keywords?.map(k =>
            k.id === keywordId ? { ...k, organicRanking: organic, gbpRanking: gbp } : k
          ),
        })
      }
      setEditingId(null)
      toast({ title: 'Ranking updated' })
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    }
  }

  // ============ Save ranking snapshot ============
  const handleSaveSnapshot = async () => {
    if (!currentRestaurant) return
    const month = new Date().toISOString().slice(0, 7) // YYYY-MM
    try {
      const rankings = currentRestaurant.keywords?.map(k => ({
        keywordId: k.id,
        organicRanking: k.organicRanking,
        gbpRanking: k.gbpRanking,
      })) || []
      const res = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: currentRestaurant.id, month, rankings }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Snapshot saved', description: `${data.saved} keyword rankings saved for ${month}.` })
    } catch (e: any) {
      toast({ title: 'Snapshot failed', description: e.message, variant: 'destructive' })
    }
  }

  // ============ CSV export ============
  const handleExportCSV = () => {
    if (!currentRestaurant?.keywords?.length) return
    const headers = ['Keyword', 'Search Volume', 'Difficulty', 'Organic Ranking', 'GBP Ranking', 'Data Source']
    const rows = currentRestaurant.keywords.map(k => [
      `"${k.keyword.replace(/"/g, '""')}"`,
      k.searchVolume,
      k.difficulty,
      k.organicRanking ?? 'N/A',
      k.gbpRanking ?? 'N/A',
      k.dataSource,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentRestaurant.name.replace(/\s+/g, '_')}_keywords.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'CSV exported' })
  }

  // ============ Google OAuth connect ============
  const handleGoogleConnect = () => {
    setGoogleConnecting(true)
    const restaurantId = currentRestaurant?.id || ''
    window.location.href = `/api/auth/google?state=${restaurantId}`
  }

  // ============ Fetch Search Console data ============
  const handleFetchSearchConsole = async () => {
    if (!googleTokens) return
    try {
      const res = await fetch('/api/google/search-console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: googleTokens.access_token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSearchConsoleData(data)
      toast({ title: 'Search Console data loaded', description: `${data.totalKeywords} real keywords found.` })
    } catch (e: any) {
      toast({ title: 'Search Console fetch failed', description: e.message, variant: 'destructive' })
    }
  }

  // ============ Fetch Analytics data ============
  const handleFetchAnalytics = async () => {
    if (!googleTokens) return
    try {
      const res = await fetch('/api/google/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: googleTokens.access_token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalyticsData(data)
      toast({ title: 'Analytics data loaded' })
    } catch (e: any) {
      toast({ title: 'Analytics fetch failed', description: e.message, variant: 'destructive' })
    }
  }

  // ============ Bulk import ============
  const handleBulkImport = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setBulkProcessing(true)
    let success = 0
    let failed = 0
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (parts.length < 2) { failed++; continue }
      try {
        const res = await fetch('/api/restaurants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: parts[0],
            location: parts[1],
            website: parts[2] || undefined,
            cuisine: parts[3] || undefined,
          }),
        })
        if (res.ok) success++
        else failed++
      } catch { failed++ }
    }
    setBulkProcessing(false)
    setBulkOpen(false)
    setBulkText('')
    await loadRestaurants()
    toast({
      title: 'Bulk import done',
      description: `${success} imported, ${failed} failed.`,
    })
  }

  // ============ Filtered + sorted keywords ============
  const displayKeywords = (() => {
    if (!currentRestaurant?.keywords) return []
    let list = [...currentRestaurant.keywords]
    if (filterSource !== 'all') {
      list = list.filter(k => k.dataSource === filterSource)
    }
    list.sort((a, b) => {
      if (sortBy === 'volume') return b.searchVolume - a.searchVolume
      if (sortBy === 'difficulty') return a.difficulty - b.difficulty
      if (sortBy === 'organic') {
        const av = a.organicRanking ?? 999
        const bv = b.organicRanking ?? 999
        return av - bv
      }
      const av = a.gbpRanking ?? 999
      const bv = b.gbpRanking ?? 999
      return av - bv
    })
    return list
  })()

  // ============ Ranking history chart data ============
  const chartData = (() => {
    if (!currentRestaurant?.keywords) return []
    const months = new Set<string>()
    currentRestaurant.keywords.forEach(k => {
      k.rankings?.forEach(r => months.add(r.month))
    })
    const sortedMonths = Array.from(months).sort()
    return sortedMonths.map(month => {
      const point: any = { month }
      currentRestaurant!.keywords!.slice(0, 5).forEach(k => {
        const r = k.rankings?.find(r => r.month === month)
        if (r) point[k.keyword.slice(0, 20)] = r.organicRanking ?? null
      })
      return point
    })
  })()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#111118]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">SEO Tracker</h1>
              <p className="text-xs text-gray-500">Find keywords for any restaurant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)} className="border-white/10 text-gray-300 hover:bg-white/5">
              <BarChart3 className="w-4 h-4 mr-1" /> Compare
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="border-white/10 text-gray-300 hover:bg-white/5">
              Bulk Import
            </Button>
            <a href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 px-2">Privacy</a>
            <a href="/terms" className="text-xs text-gray-500 hover:text-gray-300 px-2">Terms</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero + Search form */}
        <section className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              SEO Tracker — Find Keywords for Any Restaurant
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              AI generates 30+ targeted keywords with search volume, difficulty, and ranking estimates. Track monthly progress.
            </p>
          </div>

          <Card className="max-w-3xl mx-auto bg-[#13131a] border-white/10">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Restaurant Name *</Label>
                  <Input
                    id="name" value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. Pizza Hut"
                    className="bg-[#0a0a0f] border-white/10 text-white"
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-300">Location *</Label>
                  <Input
                    id="location" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="bg-[#0a0a0f] border-white/10 text-white"
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-gray-300">Website (optional)</Label>
                  <Input
                    id="website" value={website} onChange={e => setWebsite(e.target.value)}
                    placeholder="https://pizzahut.com"
                    className="bg-[#0a0a0f] border-white/10 text-white"
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuisine" className="text-gray-300">Cuisine (optional)</Label>
                  <Input
                    id="cuisine" value={cuisine} onChange={e => setCuisine(e.target.value)}
                    placeholder="e.g. Italian"
                    className="bg-[#0a0a0f] border-white/10 text-white"
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !name.trim() || !location.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold"
                size="lg"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating keywords...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate SEO Keywords</>
                )}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Results section */}
        {showResults && currentRestaurant && (
          <section className="space-y-6">
            {/* Restaurant header */}
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      {currentRestaurant.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      {currentRestaurant.location}
                      {currentRestaurant.cuisine && ` · ${currentRestaurant.cuisine}`}
                      {currentRestaurant.website && (
                        <a
                          href={currentRestaurant.website}
                          target="_blank" rel="noopener"
                          className="ml-2 inline-flex items-center gap-1 text-orange-400 hover:text-orange-300"
                        >
                          <Globe className="w-3 h-3" /> Visit site
                        </a>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={handleExportCSV} className="border-white/10 text-gray-300">
                      <Download className="w-4 h-4 mr-1" /> CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleSaveSnapshot} className="border-white/10 text-gray-300">
                      <TrendingUp className="w-4 h-4 mr-1" /> Save Snapshot
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => handleDelete(currentRestaurant.id, currentRestaurant.name)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Data sources summary */}
            {currentDataSources && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentDataSources.googleAutocomplete && (
                  <Card className="bg-[#13131a] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">Google Autocomplete</span>
                        <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400 text-xs">REAL</Badge>
                      </div>
                      <p className="text-2xl font-bold text-white">{currentDataSources.googleAutocomplete.count}</p>
                      <p className="text-xs text-gray-500">real search queries used</p>
                    </CardContent>
                  </Card>
                )}
                {currentDataSources.pageSpeed && (
                  <Card className="bg-[#13131a] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">PageSpeed Audit</span>
                        <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400 text-xs">REAL</Badge>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <div><span className="text-orange-400 font-bold">{currentDataSources.pageSpeed.performance}</span><span className="text-gray-500">/100 perf</span></div>
                        <div><span className="text-green-400 font-bold">{currentDataSources.pageSpeed.seo}</span><span className="text-gray-500">/100 seo</span></div>
                      </div>
                      {currentDataSources.pageSpeed.issues?.length > 0 && (
                        <p className="text-xs text-amber-400 mt-2">{currentDataSources.pageSpeed.issues.length} issues found</p>
                      )}
                    </CardContent>
                  </Card>
                )}
                {currentDataSources.aiEstimates && (
                  <Card className="bg-[#13131a] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-300">AI Estimates</span>
                        <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-400 text-xs">Z.AI</Badge>
                      </div>
                      <p className="text-2xl font-bold text-white">{currentDataSources.aiEstimates.count}</p>
                      <p className="text-xs text-gray-500">keywords generated by GLM-4.5</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Google integration panel */}
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Google Integration
                </CardTitle>
                <CardDescription>
                  Connect Google to fetch real Search Console and Analytics data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!googleTokens ? (
                  <Button onClick={handleGoogleConnect} disabled={googleConnecting} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    {googleConnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                    Connect Google Account
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle2 className="w-4 h-4" /> Google connected
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={handleFetchSearchConsole} className="border-white/10 text-gray-300">
                        <Search className="w-4 h-4 mr-1" /> Fetch Search Console
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleFetchAnalytics} className="border-white/10 text-gray-300">
                        <BarChart3 className="w-4 h-4 mr-1" /> Fetch Analytics
                      </Button>
                    </div>

                    {searchConsoleData && (
                      <div className="mt-3 p-3 bg-[#0a0a0f] rounded-lg border border-white/5">
                        <p className="text-sm text-gray-300 mb-2">
                          Search Console: <span className="text-orange-400">{searchConsoleData.site}</span>
                        </p>
                        <p className="text-xs text-gray-500 mb-2">{searchConsoleData.totalKeywords} real keywords from Google</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {searchConsoleData.keywords?.slice(0, 10).map((k: any, i: number) => (
                            <div key={i} className="text-xs flex justify-between text-gray-400">
                              <span>{k.keyword}</span>
                              <span className="text-gray-500">{k.impressions} imp · #{k.position}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analyticsData && (
                      <div className="mt-3 p-3 bg-[#0a0a0f] rounded-lg border border-white/5">
                        <p className="text-sm text-gray-300 mb-2">
                          Analytics: <span className="text-orange-400">{analyticsData.property}</span>
                        </p>
                        {analyticsData.metrics ? (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-white font-bold">{analyticsData.metrics.totalUsers}</span> users</div>
                            <div><span className="text-white font-bold">{analyticsData.metrics.totalSessions}</span> sessions</div>
                            <div><span className="text-white font-bold">{analyticsData.metrics.totalPageViews}</span> views</div>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-400">{analyticsData.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking history chart */}
            {chartData.length > 0 && (
              <Card className="bg-[#13131a] border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Ranking History (top 5 keywords)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" fontSize={12} />
                      <YAxis reversed stroke="#888" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: '#13131a', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <ReferenceLine y={10} stroke="#10b981" strokeDasharray="5 5" label="Top 10" />
                      <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label="Top 50" />
                      <Line type="monotone" dataKey="0" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="1" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="2" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="3" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="4" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Filters + keyword table */}
            <Card className="bg-[#13131a] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle className="text-lg text-white">
                    Keywords ({displayKeywords.length})
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <select
                      value={filterSource}
                      onChange={e => setFilterSource(e.target.value as any)}
                      className="bg-[#0a0a0f] border border-white/10 text-gray-300 text-sm rounded-md px-2 py-1"
                    >
                      <option value="all">All sources</option>
                      <option value="google_real">Google real</option>
                      <option value="ai_estimate">AI estimate</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-[#0a0a0f] border border-white/10 text-gray-300 text-sm rounded-md px-2 py-1"
                    >
                      <option value="volume">Sort: Volume</option>
                      <option value="difficulty">Sort: Difficulty</option>
                      <option value="organic">Sort: Organic</option>
                      <option value="gbp">Sort: GBP</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-gray-400">Keyword</TableHead>
                        <TableHead className="text-gray-400 text-right">Volume</TableHead>
                        <TableHead className="text-gray-400 text-right">Difficulty</TableHead>
                        <TableHead className="text-gray-400 text-right">Organic</TableHead>
                        <TableHead className="text-gray-400 text-right">GBP</TableHead>
                        <TableHead className="text-gray-400">Source</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayKeywords.map(kw => (
                        <TableRow key={kw.id} className="border-white/5">
                          <TableCell className="font-medium text-white">{kw.keyword}</TableCell>
                          <TableCell className="text-right text-gray-300">{kw.searchVolume.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className={kw.difficulty < 30 ? 'text-green-400' : kw.difficulty < 60 ? 'text-amber-400' : 'text-red-400'}>
                              {kw.difficulty}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {editingId === kw.id ? (
                              <Input
                                type="number" value={editOrganic}
                                onChange={e => setEditOrganic(e.target.value)}
                                className="w-20 h-7 bg-[#0a0a0f] border-white/10 text-white text-xs"
                                placeholder="N/A"
                              />
                            ) : kw.organicRanking ? (
                              <span className={kw.organicRanking <= 10 ? 'text-green-400 font-bold' : kw.organicRanking <= 50 ? 'text-amber-400' : 'text-gray-400'}>
                                #{kw.organicRanking}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingId === kw.id ? (
                              <Input
                                type="number" value={editGbp}
                                onChange={e => setEditGbp(e.target.value)}
                                className="w-20 h-7 bg-[#0a0a0f] border-white/10 text-white text-xs"
                                placeholder="N/A"
                              />
                            ) : kw.gbpRanking ? (
                              <span className={kw.gbpRanking <= 3 ? 'text-green-400 font-bold' : kw.gbpRanking <= 20 ? 'text-amber-400' : 'text-gray-400'}>
                                #{kw.gbpRanking}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={kw.dataSource === 'google_real'
                                ? 'border-green-500/30 text-green-400 text-xs'
                                : 'border-purple-500/30 text-purple-400 text-xs'}
                            >
                              {kw.dataSource === 'google_real' ? 'Google' : 'AI'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {editingId === kw.id ? (
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(kw.id)} className="h-7 text-green-400 hover:bg-green-500/10">
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-gray-400">
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => {
                                  setEditingId(kw.id)
                                  setEditOrganic(kw.organicRanking?.toString() ?? '')
                                  setEditGbp(kw.gbpRanking?.toString() ?? '')
                                }}
                                className="h-7 text-gray-400 hover:bg-white/5"
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Saved restaurants list */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white">Saved Restaurants</h3>
          {loadingList ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-[#13131a] border-white/10">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <Card className="bg-[#13131a] border-white/10">
              <CardContent className="p-8 text-center text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                No restaurants yet. Generate keywords above to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map(r => (
                <Card
                  key={r.id}
                  className="bg-[#13131a] border-white/10 hover:border-orange-500/30 transition-colors cursor-pointer"
                  onClick={() => loadRestaurant(r.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{r.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{r.location}</p>
                        {r.cuisine && (
                          <Badge variant="outline" className="mt-1 border-orange-500/30 text-orange-400 text-xs">
                            {r.cuisine}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="border-white/10 text-gray-400 text-xs">
                          {r.keywordCount || 0} kw
                        </Badge>
                        <Button
                          size="sm" variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.name) }}
                          className="h-6 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="bg-[#13131a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Bulk Import Restaurants</DialogTitle>
            <DialogDescription className="text-gray-400">
              One restaurant per line. Format: name, location, website, cuisine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={`Pizza Hut, Mumbai, https://pizzahut.com, Italian\nBurger King, Delhi, , American\nDomino's, Bangalore, https://dominos.com, Pizza`}
              className="w-full h-40 bg-[#0a0a0f] border border-white/10 text-white text-sm rounded-md p-3 font-mono"
            />
            <Button
              onClick={handleBulkImport}
              disabled={bulkProcessing || !bulkText.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {bulkProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Import & Generate Keywords
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="bg-[#13131a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compare Restaurants</DialogTitle>
            <DialogDescription className="text-gray-400">
              Click a restaurant to compare its keywords side by side.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {restaurants.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg border border-white/5 hover:border-orange-500/30 cursor-pointer"
                onClick={() => {
                  loadRestaurant(r.id)
                  setCompareOpen(false)
                }}
              >
                <div>
                  <p className="font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.location} · {r.keywordCount || 0} keywords</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            ))}
            {restaurants.length === 0 && (
              <p className="text-center text-gray-500 py-8">No saved restaurants to compare.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-white/5 mt-16 py-6 text-center text-xs text-gray-600">
        SEO Keyword Tracker · Built with Next.js 16, Z.AI GLM-4.5, Turso ·
        <a href="https://github.com/arjundroid12/seo-keyword-tracker" target="_blank" rel="noopener" className="ml-1 hover:text-gray-400">GitHub</a>
      </footer>
    </div>
  )
}
