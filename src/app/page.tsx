"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Play, Square, TrendingUp, Settings, Activity, Zap, BarChart3, Shield, Cpu } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Switch } from "@/src/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { Badge } from "@/src/components/ui/badge"
import { useTheme } from "next-themes"
import { Separator } from "@/src/components/ui/separator"
import { Bot3DVisualization } from "@/src/components/bot-3d-visualization"
import { getAmmPrice, startBot, stopBot } from "../services/botmain"
import { Warning } from "postcss"

export default function MarketMakerBotControl() {
  const { theme, setTheme } = useTheme()
  const [botStatus, setBotStatus] = useState<"stopped" | "running">("stopped")
  const [mounted, setMounted] = useState(false)
  const [volume, setVolume] = useState(300000)
  const [activeOrders, setActiveOrders] = useState(0)
  const [uptime, setUptime] = useState("0h 0m 0s")
  const [botParams, setBotParams] = useState({
    tradingPair: "srfx/XRP",
    baseAmount: "0.01",
    spread: "1",
    orderAmount: "20",
    refreshInterval: "30",
    maxPosition: "1000",
    stopLoss: "2.5",
    takeProfit: "10",
    server: "wss://xrplcluster.com",
    minOrderSize: "10",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (botStatus === "running") {
      setActiveOrders(12)
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const hours = Math.floor(elapsed / 3600000)
        const minutes = Math.floor((elapsed % 3600000) / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        setUptime(`${hours}h ${minutes}m ${seconds}s`)
        setVolume((prev) => prev + Math.random() * 10 - 5)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setUptime("0h 0m 0s")
      setActiveOrders(0)
    }
  }, [botStatus])

  const handleStartBot = async () => {
    setBotStatus("running")
    console.log("Starting bot with params:", botParams)
    await startBot(botParams)
  }

  const handleStopBot = async () => {
    setBotStatus("stopped")
    console.log("Stopping bot")
    await stopBot(botStatus)
  }

  const handleParamChange = (key: string, value: string | boolean) => {
    setBotParams((prev) => ({ ...prev, [key]: value }))
  }

  const [ammPriceValue, setAmmPriceValue] = useState<number | null>(null)
  useEffect(() => {
    const fetchAmmPrice = async () => {
      try {
        const result = await getAmmPrice("7372667800000000000000000000000000000000", "XRP", "rDgBV9WrwJ3WwtRWhkekMhDas3muFeKvoS", "");
        setAmmPriceValue(result);
      } catch (e) {
        setAmmPriceValue(null);
      }
    };
    fetchAmmPrice();
    const interval = setInterval(fetchAmmPrice, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-white/5 animate-slideDown">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <TrendingUp className="h-8 w-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                XRPL MM DOMINATOR
              </h1>
              <p className="text-sm text-white/60">Powered by SurferX Token</p>
            </div>
            <div className="relative ml-3">
              <div className="w-12 h-12 bg-cyan-800 rounded-full">
                <img
                  className="h-12 w-12 rounded-full shadow-2xl shadow-cyan-400 ring-4 ring-cyan-400"
                  src={'./srfx-logo.png'}
                />              
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="animate-fadeIn" style={{ animationDelay: "0.5s" }}>
              <Badge
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  botStatus === "running"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 animate-pulse"
                    : "bg-gradient-to-r from-gray-500 to-slate-500 text-white"
                }`}
              >
                <Activity className={`h-3 w-3 ${botStatus === "running" ? "animate-pulse" : ""}`} />
                {botStatus === "running" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Enhanced 3D Bot Visualization */}
          <div className="lg:col-span-5 animate-slideUp" style={{ animationDelay: "0.1s" }}>
            <Card className="h-[600px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/20 overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                  3D Bot Visualization
                </CardTitle>
                <CardDescription className="text-white/60">
                  Interactive 3D Market Maker Bot with real-time animations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[520px]">
                <Bot3DVisualization isRunning={botStatus === "running"} ammPrice={ammPriceValue ?? undefined} activeOrders={activeOrders} botParams={botParams} />
              </CardContent>
            </Card>
          </div>

          {/* Bot Control Panel */}
          <div className="lg:col-span-3 animate-slideUp" style={{ animationDelay: "0.2s" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-purple-400" />
                  Bot Control
                </CardTitle>
                <CardDescription className="text-white/60">Start or stop your bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleStartBot}
                    disabled={botStatus === "running"}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Bot
                  </Button>

                  <Button
                    onClick={handleStopBot}
                    disabled={botStatus === "stopped"}
                    className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
                    size="lg"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Bot
                  </Button>
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 animate-fadeIn"
                    style={{ animationDelay: "0.8s" }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80 text-sm">AMM</span>
                      <span className="text-green-400 font-bold">r4yg7e...w3s1Ty</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80 text-sm">Current Price</span>
                      <span className="text-cyan-400 font-bold">
                        {ammPriceValue !== null ? `${ammPriceValue.toFixed(4)} srfx/XRP` : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-sm">Uptime</span>
                      <span className="text-purple-400 font-bold">{botStatus === "running" ? uptime : "0h 0m 0s"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="lg:col-span-4 animate-slideUp" style={{ animationDelay: "0.3s" }}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-white/20 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500">
              <CardHeader>
                <CardTitle className="text-white">Bot Configuration</CardTitle>
                <CardDescription className="text-white/60">Configure your bot parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="trading" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
                    <TabsTrigger
                      value="trading"
                      className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 transition-all duration-300"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Trading
                    </TabsTrigger>
                    <TabsTrigger
                      value="risk"
                      className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 transition-all duration-300"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Risk
                    </TabsTrigger>
                    <TabsTrigger
                      value="api"
                      className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400 transition-all duration-300"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      API
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="trading" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="tradingPair" className="text-white/80">
                          Trading Pair
                        </Label>
                        <Select
                          value={botParams.tradingPair}
                          onValueChange={(value) => handleParamChange("tradingPair", value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="srfx/XRP">srfx/XRP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="baseAmount" className="text-white/80">
                          Base Amount (XRP)
                        </Label>
                        <Input
                          id="baseAmount"
                          type="number"
                          step={0.001}
                          min={0.01}
                          value={botParams.baseAmount}
                          onChange={(e) => handleParamChange("baseAmount", e.target.value)}
                          placeholder="0.01"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 hover:bg-white/20 focus:bg-white/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="spread" className="text-white/80">
                          Spread (%)
                        </Label>
                        <Input
                          id="spread"
                          type="number"
                          step="0.01"
                          min={0.75}
                          value={botParams.spread}
                          onChange={(e) => handleParamChange("spread", e.target.value)}
                          placeholder="2"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 hover:bg-white/20 focus:bg-white/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-4 mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="stopLoss" className="text-white/80">
                          Stop Loss (XRP Balance)
                        </Label>
                        <Input
                          id="stopLoss"
                          type="number"
                          step="0.1"
                          min={2.5}
                          value={botParams.stopLoss}
                          onChange={(e) => handleParamChange("stopLoss", e.target.value)}
                          placeholder="2.5"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 hover:bg-white/20 focus:bg-white/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="api" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKey" className="text-white/80">
                          XRP Server API
                        </Label>
                        <Input
                          id="apiKey"
                          type="string"
                          disabled
                          value={botParams.server}
                          onChange={(e) => handleParamChange("apiKey", e.target.value)}
                          placeholder="Enter your CoinStore API key"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 hover:bg-white/20 focus:bg-white/20 transition-all duration-300"
                        />
                      </div>

                      <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-white/80">
                          <strong>Security Note:</strong> Your API keys are stored locally and never transmitted to
                          external servers. Make sure to use API keys with trading permissions only.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
