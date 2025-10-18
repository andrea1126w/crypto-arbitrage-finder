import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowUpDown, TrendingUp, TrendingDown, Activity, DollarSign, Filter, RefreshCw, ChevronRight, AlertCircle, ExternalLink } from "lucide-react";
import type { ArbitrageOpportunity, OpportunityFilter } from "@shared/schema";
import { SUPPORTED_EXCHANGES, SUPPORTED_PAIRS } from "@shared/schema";
import { EXCHANGE_LINKS } from "@shared/exchangeLinks";

function LiveStatusIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-2" data-testid="status-connection">
      <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
      <span className="text-sm font-medium text-muted-foreground">
        {isConnected ? 'In Diretta' : 'Disconnesso'}
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
        <span className="text-muted-foreground">Profitto Lordo</span>
        <span className="font-mono font-semibold text-primary">${grossProfit.toFixed(2)}</span>
      </div>
      <div className="space-y-2 rounded-md bg-muted/30 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Commissioni Trading</span>
          <span className="font-mono text-destructive">-${tradingFees.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Commissioni Rete</span>
          <span className="font-mono text-destructive">-${networkFees.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Slippage Stimato</span>
          <span className="font-mono text-destructive">-${slippage.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
        <span className="text-foreground">Totale Commissioni</span>
        <span className="font-mono text-destructive">-${totalFees.toFixed(2)}</span>
      </div>
    </div>
  );
}

function ExecutionGuideModal({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const buyExchange = SUPPORTED_EXCHANGES.find(e => e.id === opportunity.buyExchange);
  const sellExchange = SUPPORTED_EXCHANGES.find(e => e.id === opportunity.sellExchange);
  const buyLinks = EXCHANGE_LINKS[opportunity.buyExchange];
  const sellLinks = EXCHANGE_LINKS[opportunity.sellExchange];
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full" data-testid="button-execution-guide">
          <ChevronRight className="mr-2 h-4 w-4" />
          Guida Esecuzione
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="modal-execution-guide">
        <DialogHeader>
          <DialogTitle className="text-2xl">Guida Esecuzione Manuale</DialogTitle>
          <DialogDescription>
            Istruzioni passo-passo per eseguire questa opportunità di arbitraggio
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
            <h3 className="font-semibold mb-3 text-lg">📊 Riepilogo Opportunità</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Coppia:</span>
                <span className="ml-2 font-mono font-bold text-lg">{opportunity.pair}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Profitto Netto:</span>
                <span className="ml-2 font-mono font-bold text-primary text-lg">
                  ${opportunity.netProfitUsd.toFixed(2)} ({opportunity.netProfitPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                1
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-bold text-lg mb-1">💰 Acquista su {buyExchange?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Acquista {opportunity.pair} al prezzo di <span className="font-mono font-semibold text-primary">${opportunity.buyPrice.toFixed(2)}</span>
                  </p>
                </div>

                <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                  <p className="text-sm font-semibold">🔐 Se non hai ancora un account:</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => window.open(buyLinks.register, '_blank')}
                  >
                    <span>Registrati su {buyExchange?.name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                    <li>• Clicca il pulsante sopra per aprire la pagina di registrazione</li>
                    <li>• Completa la registrazione con email e password</li>
                    <li>• Verifica la tua identità (KYC) seguendo le istruzioni</li>
                    <li>• Abilita l'autenticazione a due fattori (2FA) per sicurezza</li>
                  </ul>
                </div>

                <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                  <p className="text-sm font-semibold">💵 Deposita fondi:</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => window.open(buyLinks.depositGuide, '_blank')}
                  >
                    <span>Guida Deposito {buyExchange?.name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                    <li>• Deposita almeno $100 in USDT o altra stablecoin</li>
                    <li>• Puoi depositare tramite bonifico, carta o crypto</li>
                    <li>• Il deposito richiede 5-30 minuti per confermarsi</li>
                  </ul>
                </div>

                <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                  <p className="text-sm font-semibold">📈 Effettua l'acquisto:</p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => window.open(buyLinks.tradingUrl(opportunity.pair), '_blank')}
                  >
                    <span>Vai alla Pagina Trading {opportunity.pair}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                    <li>• Cerca la coppia {opportunity.pair} nella barra di ricerca</li>
                    <li>• Seleziona "Market Order" (ordine al mercato)</li>
                    <li>• Inserisci $100 come importo da spendere</li>
                    <li>• Clicca "Buy" (Acquista) e conferma l'ordine</li>
                    <li>• Commissione trading: circa {buyExchange?.tradingFee}%</li>
                  </ul>
                </div>
              </div>
            </div>

            {buyExchange?.type === "CEX" && sellExchange?.type === "CEX" && (
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  2
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-bold text-lg mb-1">🔄 Trasferisci a {sellExchange?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Preleva da {buyExchange?.name} e deposita su {sellExchange?.name}
                    </p>
                  </div>

                  <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                    <p className="text-sm font-semibold">📤 Preleva da {buyExchange?.name}:</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      onClick={() => window.open(buyLinks.withdrawGuide, '_blank')}
                    >
                      <span>Guida Prelievo {buyExchange?.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                      <li>• Vai su "Wallet" → "Withdraw" (Preleva)</li>
                      <li>• Seleziona {opportunity.pair.split('/')[0]}</li>
                      <li>• Inserisci l'indirizzo di deposito di {sellExchange?.name}</li>
                      <li>• Scegli la rete corretta (es: BSC, ETH, TRC20)</li>
                    </ul>
                  </div>

                  <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                    <p className="text-sm font-semibold">📥 Deposita su {sellExchange?.name}:</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-between"
                      onClick={() => window.open(sellLinks.depositGuide, '_blank')}
                    >
                      <span>Guida Deposito {sellExchange?.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                      <li>• Copia il tuo indirizzo di deposito da {sellExchange?.name}</li>
                      <li>• Incollalo nel prelievo di {buyExchange?.name}</li>
                      <li>• Attendi le conferme di rete (5-30 minuti)</li>
                      <li>• Commissione rete: circa ${opportunity.networkFees.toFixed(2)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {buyExchange?.type === "CEX" && sellExchange?.type === "CEX" ? "3" : "2"}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-bold text-lg mb-1">💸 Vendi su {sellExchange?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Vendi {opportunity.pair} al prezzo di <span className="font-mono font-semibold text-primary">${opportunity.sellPrice.toFixed(2)}</span>
                  </p>
                </div>

                <div className="space-y-2 border-l-2 border-primary/30 pl-4">
                  <p className="text-sm font-semibold">📉 Effettua la vendita:</p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full justify-between"
                    onClick={() => window.open(sellLinks.tradingUrl(opportunity.pair), '_blank')}
                  >
                    <span>Vai alla Pagina Trading {opportunity.pair}</span>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <ul className="text-xs space-y-1 text-muted-foreground ml-4">
                    <li>• Accedi al tuo account {sellExchange?.name}</li>
                    <li>• Cerca la coppia {opportunity.pair}</li>
                    <li>• Seleziona "Market Order" (ordine al mercato)</li>
                    <li>• Clicca "Sell All" (Vendi Tutto) o inserisci l'importo</li>
                    <li>• Conferma la vendita</li>
                    <li>• Commissione trading: circa {sellExchange?.tradingFee}%</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {buyExchange?.type === "CEX" && sellExchange?.type === "CEX" ? "4" : "3"}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-2">✅ Realizzo Profitto</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Il tuo profitto netto dopo tutte le commissioni dovrebbe essere circa:
                </p>
                <div className="text-center p-4 rounded-lg bg-primary/20">
                  <div className="text-3xl font-bold font-mono text-primary">
                    ${opportunity.netProfitUsd.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ({opportunity.netProfitPercentage.toFixed(2)}% del capitale)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-destructive mb-2 text-base">⚠️ Avvertenze Importanti</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>• <strong>I prezzi cambiano rapidamente</strong> - questa opportunità potrebbe scomparire in pochi minuti</li>
                  <li>• <strong>Le commissioni variano</strong> - quelle reali potrebbero differire dalle stime</li>
                  <li>• <strong>Congestione di rete</strong> - può aumentare significativamente le commissioni</li>
                  <li>• <strong>Verifica sempre i prezzi</strong> - prima di eseguire qualsiasi operazione</li>
                  <li>• <strong>Non investire più di quanto puoi permetterti di perdere</strong></li>
                  <li>• <strong>Slippage</strong> - il prezzo effettivo può differire da quello mostrato</li>
                  <li>• <strong>Tempi di trasferimento</strong> - i trasferimenti tra exchange richiedono tempo</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/30 p-4">
            <h3 className="font-semibold mb-3">💡 Suggerimenti per Massimizzare i Profitti</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• <strong>Mantieni fondi su più exchange</strong> - evita tempi di trasferimento</li>
              <li>• <strong>Usa exchange centralizzati</strong> - commissioni più basse dei DEX</li>
              <li>• <strong>Agisci velocemente</strong> - le opportunità spariscono rapidamente</li>
              <li>• <strong>Verifica i livelli VIP</strong> - commissioni ridotte per volumi alti</li>
              <li>• <strong>Monitora il gas fee</strong> - evita orari di congestione di rete</li>
            </ul>
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
                  Alto Profitto
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {buyExchange?.type}
              </Badge>
              <span>•</span>
              <span>{new Date(opportunity.timestamp).toLocaleTimeString('it-IT')}</span>
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
              Acquista Da
            </div>
            <div className="font-semibold" data-testid="text-buy-exchange">{buyExchange?.name}</div>
            <div className="font-mono text-sm text-primary" data-testid="text-buy-price">
              ${opportunity.buyPrice.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <TrendingUp className="h-3 w-3" />
              Vendi A
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
          <h2 className="text-xl font-bold mb-2">Calcolatore Profitti</h2>
          <p className="text-sm text-muted-foreground">
            Calcola potenziali profitti con il tuo capitale
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Capitale (USD)
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
                Migliore Opportunità
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
                <span className="text-muted-foreground">Tuo Capitale</span>
                <span className="font-mono font-semibold">${capital.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Percentuale Profitto</span>
                <span className="font-mono font-semibold text-primary">
                  {bestOpportunity.netProfitPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Profitto Stimato</span>
                  <span className="font-mono text-2xl font-bold text-primary" data-testid="text-estimated-profit">
                    ${estimatedProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Nessuna opportunità profittevole al momento
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Calcoli basati sulla migliore opportunità attuale</p>
          <p>• I profitti effettivi possono variare per condizioni di mercato</p>
          <p>• Verifica sempre i prezzi prima di eseguire operazioni</p>
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
      console.log("WebSocket connesso");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "opportunities_update") {
          setLastUpdate(new Date());
          refetch();
        }
      } catch (error) {
        console.error("Errore parsing messaggio WebSocket:", error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnesso");
    };

    socket.onerror = (error) => {
      console.error("Errore WebSocket:", error);
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
                Scanner opportunità in tempo reale su exchange multipli
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
                Aggiorna
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
                <div className="text-sm text-muted-foreground mb-1">Opportunità Totali</div>
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
                <div className="text-sm text-muted-foreground mb-1">Profittevoli</div>
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
                <div className="text-sm text-muted-foreground mb-1">Migliore Opportunità</div>
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
            <span className="text-sm font-medium">Filtri:</span>
          </div>
          
          <Select
            value={filter.exchangeType || "ALL"}
            onValueChange={(value) => setFilter({ ...filter, exchangeType: value as any })}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-exchange-type">
              <SelectValue placeholder="Tipo Exchange" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutti gli Exchange</SelectItem>
              <SelectItem value="CEX">Centralizzati (CEX)</SelectItem>
              <SelectItem value="DEX">Decentralizzati (DEX)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.minProfitPercentage?.toString() || "0"}
            onValueChange={(value) => setFilter({ ...filter, minProfitPercentage: Number(value) })}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-min-profit">
              <SelectValue placeholder="Profitto Minimo %" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Tutti i Profitti</SelectItem>
              <SelectItem value="0.5">&gt; 0.5%</SelectItem>
              <SelectItem value="1">&gt; 1%</SelectItem>
              <SelectItem value="2">&gt; 2%</SelectItem>
              <SelectItem value="5">&gt; 5%</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-xs text-muted-foreground ml-auto">
            Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
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
                  <h3 className="text-lg font-semibold mb-2">Nessuna Opportunità Trovata</h3>
                  <p className="text-sm text-muted-foreground">
                    Modifica i filtri o attendi che appaiano nuove opportunità
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
