import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpDown, TrendingUp, TrendingDown, Activity, DollarSign, Filter, RefreshCw, ChevronRight, AlertCircle } from "lucide-react";
import type { ArbitrageOpportunity, OpportunityFilter } from "@shared/schema";
import { SUPPORTED_EXCHANGES, SUPPORTED_PAIRS } from "@shared/schema";

function LiveStatusIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid="status-connection">
      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
      <span className="text-sm font-medium text-muted-foreground">
        {isConnected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  );
}

function FeeBreakdown({ 
  tradingFees, 
  networkFees, 
  slippage, 
  grossProfit 
}: { 
  tradingFees: number; 
  networkFees: number; 
  slippage: number; 
  grossProfit: number; 
}) {
  const totalFees = tradingFees + networkFees + slippage;
  
  return (
    <div className="space-y-3" data-testid="fee-breakdown">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Gross Profit</span>
        <span className="font-mono font-semibold text-primary">${grossProfit.toFixed(2)}</span>
      </div>
      <div className="space-y-2 rounded-md bg-muted/30 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Trading Fees</span>
          <span className="font-mono text-destructive">-${tradingFees.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Network Fees</span>
          <span className="font-mono text-destructive">-${networkFees.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Estimated Slippage</span>
          <span className="font-mono text-destructive">-${slippage.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
        <span className="text-foreground">Total Fees</span>
        <span className="font-mono text-destructive">-${totalFees.toFixed(2)}</span>
      </div>
    </div>
  );
}

function ExecutionGuideModal({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const buyExchange = SUPPORTED_EXCHANGES.find(e => e.id === opportunity.buyExchange);
  const sellExchange = SUPPORTED_EXCHANGES.find(e => e.id === opportunity.sellExchange);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full" data-testid="button-execution-guide">
          <ChevronRight className="mr-2 h-4 w-4" />
          Execution Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-execution-guide">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manual Execution Guide</DialogTitle>
          <DialogDescription>
            Step-by-step instructions to execute this arbitrage opportunity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="rounded-lg bg-muted/30 p-4">
            <h3 className="font-semibold mb-2">Opportunity Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Pair:</span>
                <span className="ml-2 font-mono font-semibold">{opportunity.pair}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Net Profit:</span>
                <span className="ml-2 font-mono font-semibold text-primary">
                  ${opportunity.netProfitUsd.toFixed(2)} ({opportunity.netProfitPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Buy on {buyExchange?.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Purchase {opportunity.pair} at ${opportunity.buyPrice.toFixed(2)}
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Log into your {buyExchange?.name} account</li>
                  <li>• Navigate to {opportunity.pair} trading pair</li>
                  <li>• Place a market buy order for $100 worth</li>
                  <li>• Trading fee: ~{buyExchange?.tradingFee}%</li>
                </ul>
              </div>
            </div>

            {buyExchange?.type === "CEX" && sellExchange?.type === "CEX" && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Transfer to {sellExchange?.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Withdraw from {buyExchange?.name} and deposit to {sellExchange?.name}
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Initiate withdrawal from {buyExchange?.name}</li>
                    <li>• Use your {sellExchange?.name} deposit address</li>
                    <li>• Wait for network confirmations (5-30 min)</li>
                    <li>• Network fees will apply</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {buyExchange?.type === "CEX" && sellExchange?.type === "CEX" ? "3" : "2"}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Sell on {sellExchange?.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Sell {opportunity.pair} at ${opportunity.sellPrice.toFixed(2)}
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Log into your {sellExchange?.name} account</li>
                  <li>• Navigate to {opportunity.pair} trading pair</li>
                  <li>• Place a market sell order for all your holdings</li>
                  <li>• Trading fee: ~{sellExchange?.tradingFee}%</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {buyExchange?.type === "CEX" && sellExchange?.type === "CEX" ? "4" : "3"}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Realize Profit</h4>
                <p className="text-sm text-muted-foreground">
                  Your net profit after all fees should be approximately ${opportunity.netProfitUsd.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-destructive mb-1">Important Warnings</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Prices change rapidly - this opportunity may disappear</li>
                  <li>• Actual fees may vary from estimates</li>
                  <li>• Network congestion can increase fees significantly</li>
                  <li>• Always verify prices before executing trades</li>
                  <li>• Never invest more than you can afford to lose</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OpportunityCard({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const isProfitable = opportunity.netProfitUsd > 0;
  const isHighProfit = opportunity.netProfitPercentage >= 2;
  const isMediumProfit = opportunity.netProfitPercentage >= 1 && opportunity.netProfitPercentage < 2;
  
  const buyExchange = SUPPORTED_EXCHANGES.find(e => e.id === opportunity.buyExchange);
  const sellExchange = SUPPORTED_EXCHANGES.find(e => e.id === opportunity.sellExchange);
  
  return (
    <Card 
      className={`p-6 hover-elevate transition-all duration-200 ${
        isHighProfit ? 'border-primary/50' : isMediumProfit ? 'border-chart-3/50' : ''
      }`}
      data-testid={`card-opportunity-${opportunity.id}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold font-mono" data-testid="text-pair">
                {opportunity.pair}
              </h3>
              {isHighProfit && (
                <Badge variant="default" className="bg-primary text-primary-foreground" data-testid="badge-high-profit">
                  High Profit
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {buyExchange?.type}
              </Badge>
              <span>•</span>
              <span>{new Date(opportunity.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold font-mono ${isProfitable ? 'text-primary' : 'text-destructive'}`} data-testid="text-profit">
              {isProfitable ? '+' : ''}{opportunity.netProfitPercentage.toFixed(2)}%
            </div>
            <div className={`text-sm font-mono ${isProfitable ? 'text-primary' : 'text-destructive'}`}>
              ${opportunity.netProfitUsd.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <TrendingDown className="h-3 w-3" />
              Buy From
            </div>
            <div className="font-semibold" data-testid="text-buy-exchange">{buyExchange?.name}</div>
            <div className="font-mono text-sm text-primary" data-testid="text-buy-price">
              ${opportunity.buyPrice.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <TrendingUp className="h-3 w-3" />
              Sell To
            </div>
            <div className="font-semibold" data-testid="text-sell-exchange">{sellExchange?.name}</div>
            <div className="font-mono text-sm text-primary" data-testid="text-sell-price">
              ${opportunity.sellPrice.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spread</span>
            <span className="font-mono font-semibold" data-testid="text-spread">
              {opportunity.spreadPercentage.toFixed(2)}%
            </span>
          </div>
          
          <FeeBreakdown
            tradingFees={opportunity.tradingFees}
            networkFees={opportunity.networkFees}
            slippage={opportunity.slippage}
            grossProfit={opportunity.grossProfitUsd}
          />
        </div>

        <ExecutionGuideModal opportunity={opportunity} />
      </div>
    </Card>
  );
}

function ProfitCalculator() {
  const [capital, setCapital] = useState(100);
  const { data: opportunities = [] } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  const bestOpportunity = opportunities
    .filter(opp => opp.netProfitUsd > 0)
    .sort((a, b) => b.netProfitPercentage - a.netProfitPercentage)[0];

  const estimatedProfit = bestOpportunity 
    ? (capital * bestOpportunity.netProfitPercentage) / 100
    : 0;

  return (
    <Card className="p-6 sticky top-6" data-testid="calculator-profit">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Profit Calculator</h2>
          <p className="text-sm text-muted-foreground">
            Calculate potential profits with your capital
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Capital Amount (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="pl-9 font-mono"
              min={1}
              step={10}
              data-testid="input-capital"
            />
          </div>
        </div>

        {bestOpportunity ? (
          <div className="space-y-4 rounded-lg bg-primary/5 border border-primary/20 p-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Best Opportunity
              </div>
              <div className="font-mono font-semibold text-lg" data-testid="text-best-pair">
                {bestOpportunity.pair}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {SUPPORTED_EXCHANGES.find(e => e.id === bestOpportunity.buyExchange)?.name} → {SUPPORTED_EXCHANGES.find(e => e.id === bestOpportunity.sellExchange)?.name}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Capital</span>
                <span className="font-mono font-semibold">${capital.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Profit Rate</span>
                <span className="font-mono font-semibold text-primary">
                  {bestOpportunity.netProfitPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Estimated Profit</span>
                  <span className="font-mono text-2xl font-bold text-primary" data-testid="text-estimated-profit">
                    ${estimatedProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            No profitable opportunities available at the moment
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Calculations based on best current opportunity</p>
          <p>• Actual profits may vary due to market conditions</p>
          <p>• Always verify prices before executing trades</p>
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [filter, setFilter] = useState<OpportunityFilter>({
    minProfitPercentage: 0,
    exchangeType: "ALL",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data: opportunities = [], isLoading, refetch } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "opportunities_update") {
          setLastUpdate(new Date());
          refetch();
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [refetch]);

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter.minProfitPercentage && opp.netProfitPercentage < filter.minProfitPercentage) {
      return false;
    }
    if (filter.exchangeType && filter.exchangeType !== "ALL") {
      const buyExchange = SUPPORTED_EXCHANGES.find(e => e.id === opp.buyExchange);
      const sellExchange = SUPPORTED_EXCHANGES.find(e => e.id === opp.sellExchange);
      if (buyExchange?.type !== filter.exchangeType && sellExchange?.type !== filter.exchangeType) {
        return false;
      }
    }
    return true;
  });

  const profitableCount = filteredOpportunities.filter(opp => opp.netProfitUsd > 0).length;
  const bestOpportunity = filteredOpportunities
    .filter(opp => opp.netProfitUsd > 0)
    .sort((a, b) => b.netProfitPercentage - a.netProfitPercentage)[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1" data-testid="text-title">
                Crypto Arbitrage Finder
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time opportunity scanner across multiple exchanges
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LiveStatusIndicator isConnected={isConnected} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Total Opportunities</div>
                <div className="text-3xl font-bold font-mono" data-testid="text-total-opportunities">
                  {filteredOpportunities.length}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Profitable</div>
                <div className="text-3xl font-bold font-mono text-primary" data-testid="text-profitable-count">
                  {profitableCount}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Best Opportunity</div>
                <div className="text-3xl font-bold font-mono text-primary" data-testid="text-best-opportunity">
                  {bestOpportunity ? `${bestOpportunity.netProfitPercentage.toFixed(2)}%` : '0%'}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowUpDown className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select
            value={filter.exchangeType || "ALL"}
            onValueChange={(value) => setFilter({ ...filter, exchangeType: value as any })}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-exchange-type">
              <SelectValue placeholder="Exchange Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Exchanges</SelectItem>
              <SelectItem value="CEX">Centralized (CEX)</SelectItem>
              <SelectItem value="DEX">Decentralized (DEX)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.minProfitPercentage?.toString() || "0"}
            onValueChange={(value) => setFilter({ ...filter, minProfitPercentage: Number(value) })}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-min-profit">
              <SelectValue placeholder="Min Profit %" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Profits</SelectItem>
              <SelectItem value="0.5">&gt; 0.5%</SelectItem>
              <SelectItem value="1">&gt; 1%</SelectItem>
              <SelectItem value="2">&gt; 2%</SelectItem>
              <SelectItem value="5">&gt; 5%</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground ml-auto">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust your filters or wait for new opportunities to appear
                  </p>
                </div>
              </Card>
            ) : (
              filteredOpportunities
                .sort((a, b) => b.netProfitPercentage - a.netProfitPercentage)
                .map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))
            )}
          </div>

          <div className="lg:col-span-1">
            <ProfitCalculator />
          </div>
        </div>
      </div>
    </div>
  );
}
