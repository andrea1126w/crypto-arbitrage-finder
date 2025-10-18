import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, Award, Calendar, RefreshCw } from "lucide-react";
import type { OpportunityHistory } from "@shared/schema";
import { SUPPORTED_EXCHANGES } from "@shared/schema";

interface HistoryStats {
  totalOpportunities: number;
  profitableOpportunities: number;
  totalProfitUsd: number;
  averageProfitPercentage: number;
  bestOpportunity: OpportunityHistory | null;
}

const COLORS = ['#8BC34A', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("7");

  const { data: stats, isLoading: statsLoading } = useQuery<HistoryStats>({
    queryKey: ["/api/history/stats"],
  });

  const { data: history = [], isLoading: historyLoading, refetch } = useQuery<OpportunityHistory[]>({
    queryKey: ["/api/history"],
  });

  const getFilteredHistory = () => {
    if (timeRange === "all") return history;
    
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return history.filter(h => new Date(h.timestamp) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();

  // Profitti nel tempo (ultimi N giorni)
  const profitOverTime = filteredHistory.reduce((acc, opp) => {
    const date = new Date(opp.timestamp).toLocaleDateString('it-IT', { 
      month: 'short', 
      day: 'numeric' 
    });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.profitto += opp.netProfitUsd;
      existing.opportunita += 1;
    } else {
      acc.push({ 
        date, 
        profitto: opp.netProfitUsd, 
        opportunita: 1,
        timestamp: new Date(opp.timestamp).getTime()
      });
    }
    return acc;
  }, [] as { date: string; profitto: number; opportunita: number; timestamp: number }[])
  .sort((a, b) => a.timestamp - b.timestamp)
  .slice(-14);

  // Migliori exchange per profitto
  const exchangeStats = filteredHistory.reduce((acc, opp) => {
    const buy = acc.find(e => e.exchange === opp.buyExchange);
    const sell = acc.find(e => e.exchange === opp.sellExchange);
    
    if (buy) {
      buy.opportunita += 0.5;
      buy.profitto += opp.netProfitUsd / 2;
    } else {
      acc.push({ 
        exchange: opp.buyExchange, 
        opportunita: 0.5, 
        profitto: opp.netProfitUsd / 2 
      });
    }
    
    if (sell) {
      sell.opportunita += 0.5;
      sell.profitto += opp.netProfitUsd / 2;
    } else {
      acc.push({ 
        exchange: opp.sellExchange, 
        opportunita: 0.5, 
        profitto: opp.netProfitUsd / 2 
      });
    }
    
    return acc;
  }, [] as { exchange: string; opportunita: number; profitto: number }[])
  .sort((a, b) => b.profitto - a.profitto)
  .slice(0, 7)
  .map(item => ({
    ...item,
    name: SUPPORTED_EXCHANGES.find(e => e.id === item.exchange)?.name || item.exchange,
  }));

  // Migliori coppie crypto
  const pairStats = filteredHistory.reduce((acc, opp) => {
    const existing = acc.find(p => p.pair === opp.pair);
    if (existing) {
      existing.opportunita += 1;
      existing.profitto += opp.netProfitUsd;
    } else {
      acc.push({ 
        pair: opp.pair, 
        opportunita: 1, 
        profitto: opp.netProfitUsd 
      });
    }
    return acc;
  }, [] as { pair: string; opportunita: number; profitto: number }[])
  .sort((a, b) => b.opportunita - a.opportunita)
  .slice(0, 10);

  // Distribuzione profitti per ora del giorno
  const hourlyDistribution = filteredHistory.reduce((acc, opp) => {
    const hour = new Date(opp.timestamp).getHours();
    const existing = acc.find(h => h.hour === hour);
    if (existing) {
      existing.count += 1;
      existing.avgProfit = (existing.avgProfit * (existing.count - 1) + opp.netProfitPercentage) / existing.count;
    } else {
      acc.push({ 
        hour, 
        count: 1, 
        avgProfit: opp.netProfitPercentage,
        label: `${hour}:00`
      });
    }
    return acc;
  }, [] as { hour: number; count: number; avgProfit: number; label: string }[])
  .sort((a, b) => a.hour - b.hour);

  const isLoading = statsLoading || historyLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1" data-testid="text-analytics-title">
                Dashboard Analytics
              </h1>
              <p className="text-sm text-muted-foreground">
                Analisi storica delle opportunità di arbitraggio
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]" data-testid="select-timerange">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Oggi</SelectItem>
                  <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                  <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                  <SelectItem value="all">Tutto lo storico</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-analytics"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Opportunità Totali</div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono" data-testid="text-total-opportunities">
                  {stats?.totalOpportunities || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {filteredHistory.length} nel periodo selezionato
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Profittevoli</div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono text-primary" data-testid="text-profitable-opportunities">
                  {stats?.profitableOpportunities || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stats?.totalOpportunities ? 
                    ((stats.profitableOpportunities / stats.totalOpportunities) * 100).toFixed(1) : 0}% tasso successo
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Profitto Totale</div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono text-primary" data-testid="text-total-profit">
                  ${stats?.totalProfitUsd.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${(filteredHistory.reduce((sum, h) => sum + h.netProfitUsd, 0)).toFixed(2)} nel periodo
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Profitto Medio</div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold font-mono text-primary" data-testid="text-avg-profit">
                  {stats?.averageProfitPercentage.toFixed(2) || '0.00'}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Migliore: {stats?.bestOpportunity?.netProfitPercentage.toFixed(2) || '0.00'}%
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Profitti nel Tempo</h3>
                {profitOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={profitOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="profitto" 
                        name="Profitto ($)" 
                        stroke="#8BC34A" 
                        strokeWidth={2}
                        dot={{ fill: '#8BC34A' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nessun dato disponibile per il periodo selezionato
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Opportunità per Ora del Giorno</h3>
                {hourlyDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="label" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="N° Opportunità" fill="#8BC34A" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Migliori Exchange per Profitto</h3>
                {exchangeStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={exchangeStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        type="number" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="profitto" name="Profitto ($)" fill="#8BC34A" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Top 10 Coppie Crypto</h3>
                {pairStats.length > 0 ? (
                  <div className="space-y-3">
                    {pairStats.map((pair, index) => (
                      <div 
                        key={pair.pair} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-mono font-semibold">{pair.pair}</div>
                            <div className="text-xs text-muted-foreground">
                              {pair.opportunita} opportunità
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-primary">
                            ${pair.profitto.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${(pair.profitto / pair.opportunita).toFixed(2)}/opp
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    Nessun dato disponibile
                  </div>
                )}
              </Card>
            </div>

            {stats?.bestOpportunity && (
              <Card className="p-6 mt-6 border-primary/50 bg-primary/5">
                <h3 className="text-lg font-bold mb-4">🏆 Migliore Opportunità di Sempre</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Coppia</div>
                    <div className="font-mono font-bold text-lg">{stats.bestOpportunity.pair}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Exchange</div>
                    <div className="font-semibold">
                      {SUPPORTED_EXCHANGES.find(e => e.id === stats.bestOpportunity!.buyExchange)?.name} → {SUPPORTED_EXCHANGES.find(e => e.id === stats.bestOpportunity!.sellExchange)?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Profitto</div>
                    <div className="font-mono font-bold text-xl text-primary">
                      {stats.bestOpportunity.netProfitPercentage.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Data</div>
                    <div className="font-semibold">
                      {new Date(stats.bestOpportunity.timestamp).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
