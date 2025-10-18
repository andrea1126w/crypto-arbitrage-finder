import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Zap, TrendingUp, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ArbitrageOpportunity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ExecuteTradeButtonProps {
  opportunity: ArbitrageOpportunity;
  hasApiKeys: boolean;
}

export function ExecuteTradeButton({ opportunity, hasApiKeys }: ExecuteTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tradeResult, setTradeResult] = useState<{
    success: boolean;
    message: string;
    buyOrderId?: string;
    sellOrderId?: string;
    actualProfit?: number;
  } | null>(null);
  const { toast } = useToast();

  const handleExecuteTrade = async () => {
    setIsExecuting(true);
    setTradeResult(null);

    try {
      if (!hasApiKeys) {
        // Modalità simulazione
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const simulatedProfit = opportunity.netProfitUsd * (0.85 + Math.random() * 0.15);
        setTradeResult({
          success: true,
          message: "Trade simulato eseguito con successo",
          buyOrderId: `SIM-BUY-${Date.now()}`,
          sellOrderId: `SIM-SELL-${Date.now()}`,
          actualProfit: simulatedProfit,
        });

        toast({
          title: "✅ Trade Simulato Completato",
          description: `Profitto simulato: $${simulatedProfit.toFixed(2)}`,
        });
      } else {
        // Esecuzione reale con API
        const capital = 100; // $100 capitale default
        const amount = capital / opportunity.buyPrice;
        
        const response = await fetch("/api/execute-trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opportunityId: opportunity.id,
            pair: opportunity.pair,
            buyExchange: opportunity.buyExchange,
            sellExchange: opportunity.sellExchange,
            buyPrice: opportunity.buyPrice,
            sellPrice: opportunity.sellPrice,
            amount,
            capital,
          }),
        });

        const result = await response.json();
        setTradeResult(result);

        if (result.success) {
          toast({
            title: "✅ Trade Eseguito!",
            description: `Profitto reale: $${result.actualProfit?.toFixed(2)}`,
          });
        } else {
          toast({
            title: "❌ Trade Fallito",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      setTradeResult({
        success: false,
        message: error.message || "Errore durante l'esecuzione del trade",
      });

      toast({
        title: "❌ Errore",
        description: "Impossibile eseguire il trade",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="default"
        size="sm"
        data-testid={`button-execute-trade-${opportunity.id}`}
      >
        <Zap className="h-4 w-4" />
        ESEGUI TRADE
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl" data-testid="modal-execute-trade">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Conferma Esecuzione Trade
            </DialogTitle>
            <DialogDescription>
              {hasApiKeys
                ? "Esegui questo arbitraggio automaticamente con i tuoi exchange connessi"
                : "Modalità simulazione - Registrati e connetti API keys per trading reale"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!hasApiKeys && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-1">
                    Modalità Demo Attiva
                  </p>
                  <p className="text-muted-foreground">
                    Connetti i tuoi exchange da "Connessione Rapida" per eseguire trade reali.
                    Questa è una simulazione per mostrarti come funziona.
                  </p>
                </div>
              </div>
            )}

            {/* Trade Details */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Dettagli Operazione</h3>
                <Badge variant="default">{opportunity.pair}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-green-500/10 rounded-md border border-green-500/30">
                    <div className="text-xs text-muted-foreground mb-1">COMPRA SU</div>
                    <div className="font-semibold text-lg">{opportunity.buyExchange}</div>
                    <div className="text-sm text-green-600 font-mono">
                      ${opportunity.buyPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quantità: {(100 / opportunity.buyPrice).toFixed(4)} {opportunity.pair.split('/')[0]}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-red-500/10 rounded-md border border-red-500/30">
                    <div className="text-xs text-muted-foreground mb-1">VENDI SU</div>
                    <div className="font-semibold text-lg">{opportunity.sellExchange}</div>
                    <div className="text-sm text-red-600 font-mono">
                      ${opportunity.sellPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ricavo: ${((100 / opportunity.buyPrice) * opportunity.sellPrice).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Profitto Netto Stimato</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Dopo commissioni ({(opportunity.tradingFees + opportunity.networkFees).toFixed(2)}%)
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    ${opportunity.netProfitUsd.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Execution Steps */}
            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-sm mb-3">Cosa Succederà:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span>Sistema eseguirà market buy su {opportunity.buyExchange}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span>Simultaneamente eseguirà market sell su {opportunity.sellExchange}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span>Profitto verrà accreditato automaticamente sul tuo saldo</span>
                </div>
              </div>
            </Card>

            {/* Trade Result */}
            {tradeResult && (
              <Card className={`p-4 ${tradeResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-start gap-3">
                  {tradeResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold mb-2 ${tradeResult.success ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                      {tradeResult.success ? '✅ Trade Completato!' : '❌ Trade Fallito'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">{tradeResult.message}</p>
                    
                    {tradeResult.success && (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                          <span>Order ID Acquisto:</span>
                          <span className="font-mono">{tradeResult.buyOrderId}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                          <span>Order ID Vendita:</span>
                          <span className="font-mono">{tradeResult.sellOrderId}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-primary/20 rounded font-semibold">
                          <span>Profitto Reale:</span>
                          <span className="text-primary">${tradeResult.actualProfit?.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExecuting}
            >
              {tradeResult ? 'Chiudi' : 'Annulla'}
            </Button>
            {!tradeResult && (
              <Button
                onClick={handleExecuteTrade}
                disabled={isExecuting}
                className="gap-2"
                data-testid="button-confirm-execute"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Esecuzione in corso...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    {hasApiKeys ? 'Conferma ed Esegui' : 'Simula Trade'}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
