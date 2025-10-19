import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Target, Award } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#8BC34A', '#FF9800', '#03A9F4', '#E91E63', '#9C27B0'];

export function AdvancedAnalytics() {
  const { data: performance } = useQuery({
    queryKey: ["/api/analytics/performance"],
  });

  const { data: exchangePerf } = useQuery({
    queryKey: ["/api/analytics/exchange-performance"],
  });

  const { data: pairPerf } = useQuery({
    queryKey: ["/api/analytics/pair-performance"],
  });

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card data-testid="card-analytics-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview (30 Giorni)
          </CardTitle>
          <CardDescription>Metriche avanzate di trading</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profitto Totale</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-total-profit">
                ${(performance?.totalProfit || 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trade Totali</p>
              <p className="text-2xl font-bold">{performance?.totalTrades || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{(performance?.avgWinRate || 0).toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Giorni Attivi</p>
              <p className="text-2xl font-bold">{performance?.metricsCount || 0}</p>
            </div>
          </div>

          {/* Equity Curve */}
          {performance?.metrics && performance.metrics.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performance.metrics.reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('it-IT')}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalProfit" stroke="#8BC34A" name="Profitto" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Exchange Performance */}
        <Card data-testid="card-exchange-performance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance per Exchange
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exchangePerf && exchangePerf.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exchangePerf.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="exchange" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="profit" fill="#8BC34A" name="Profitto ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>

        {/* Pair Performance */}
        <Card data-testid="card-pair-performance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top 5 Coppie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pairPerf && pairPerf.length > 0 ? (
              <div className="space-y-3">
                {pairPerf.slice(0, 5).map((pair: any, idx: number) => (
                  <div key={pair.pair} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-mono font-semibold">{pair.pair}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">${pair.profit.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{pair.trades} trades</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nessun dato disponibile</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
