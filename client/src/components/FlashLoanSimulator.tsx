import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function FlashLoanSimulator() {
  const [loanAmount, setLoanAmount] = useState(50000);
  const [spreadPercent, setSpreadPercent] = useState(1.5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    profit: number;
    steps: string[];
  } | null>(null);

  const flashLoanFee = 0.09; // 0.09% Aave flash loan fee
  const gasCost = 15; // $15 gas fee stimato
  
  const calculateProfit = () => {
    const spread = loanAmount * (spreadPercent / 100);
    const fee = loanAmount * (flashLoanFee / 100);
    const profit = spread - fee - gasCost;
    return profit;
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const profit = calculateProfit();
    const success = profit > 0;

    setSimulationResult({
      success,
      profit,
      steps: [
        `1. Prendi in prestito $${loanAmount.toLocaleString()} da Aave (flash loan)`,
        `2. Compra crypto su Exchange A al prezzo più basso`,
        `3. Vendi crypto su Exchange B al prezzo più alto`,
        `4. Profitto dallo spread: +$${(loanAmount * (spreadPercent / 100)).toFixed(2)}`,
        `5. Paga fee flash loan (${flashLoanFee}%): -$${(loanAmount * (flashLoanFee / 100)).toFixed(2)}`,
        `6. Paga gas fee Ethereum: -$${gasCost.toFixed(2)}`,
        `7. Restituisci $${loanAmount.toLocaleString()} ad Aave`,
        `8. ${success ? `✅ Tieni profitto: +$${profit.toFixed(2)}` : `❌ Perdita: -$${Math.abs(profit).toFixed(2)}`}`,
      ],
    });

    setIsSimulating(false);
  };

  const estimatedProfit = calculateProfit();

  return (
    <Card className="p-6" data-testid="panel-flash-loan">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            ⚡ Flash Loan Arbitraggio
          </h2>
          <p className="text-sm text-muted-foreground">
            Simula operazioni di arbitraggio con capitale preso in prestito per 1 blocco (~13 secondi)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30">
            <div className="text-xs text-muted-foreground mb-2">Capitale Necessario</div>
            <div className="text-2xl font-bold text-yellow-600">$0</div>
            <div className="text-xs text-muted-foreground mt-1">Prestito flash!</div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-2">Importo Prestito</div>
            <div className="text-2xl font-bold text-primary">
              ${loanAmount.toLocaleString()}
            </div>
          </Card>

          <Card className={`p-4 text-center ${estimatedProfit > 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="text-xs text-muted-foreground mb-2">Profitto Stimato</div>
            <div className={`text-2xl font-bold ${estimatedProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {estimatedProfit > 0 ? '+' : ''}${estimatedProfit.toFixed(2)}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Importo Flash Loan (USD)</Label>
              <span className="text-sm font-mono text-primary">${loanAmount.toLocaleString()}</span>
            </div>
            <Slider
              value={[loanAmount]}
              onValueChange={([value]) => setLoanAmount(value)}
              min={10000}
              max={200000}
              step={10000}
              data-testid="slider-loan-amount"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$10,000</span>
              <span>$200,000</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Spread Disponibile (%)</Label>
              <span className="text-sm font-mono text-primary">{spreadPercent.toFixed(1)}%</span>
            </div>
            <Slider
              value={[spreadPercent]}
              onValueChange={([value]) => setSpreadPercent(value)}
              min={0.5}
              max={5}
              step={0.1}
              data-testid="slider-spread"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5%</span>
              <span>5.0%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profitto da Spread:</span>
              <span className="font-mono text-green-600">
                +${(loanAmount * (spreadPercent / 100)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee Flash Loan ({flashLoanFee}%):</span>
              <span className="font-mono text-red-600">
                -${(loanAmount * (flashLoanFee / 100)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gas Fee (ETH):</span>
              <span className="font-mono text-red-600">-${gasCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">PROFITTO NETTO</div>
              <div className={`text-3xl font-bold ${estimatedProfit > 0 ? 'text-primary' : 'text-destructive'}`}>
                {estimatedProfit > 0 ? '+' : ''}${estimatedProfit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={isSimulating || estimatedProfit <= 0}
          className="w-full gap-2"
          size="lg"
          data-testid="button-simulate-flash-loan"
        >
          {isSimulating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Simulazione in corso...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Simula Flash Loan Arbitraggio
            </>
          )}
        </Button>

        {simulationResult && (
          <Card className={`p-4 ${simulationResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-start gap-3">
              {simulationResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold mb-3 ${simulationResult.success ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                  {simulationResult.success ? '✅ Flash Loan Profittevole!' : '❌ Flash Loan Non Profittevole'}
                </p>
                
                <div className="space-y-2 text-xs">
                  <p className="font-semibold">Esecuzione Step-by-Step:</p>
                  {simulationResult.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                        {idx < 8 ? idx + 1 : '✓'}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500">
              ⚠️ Nota Importante - Avanzato
            </p>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 ml-7">
            <li>• Flash loans richiedono conoscenza avanzata di smart contracts</li>
            <li>• Gas fees elevati su Ethereum ($15-50 per transazione)</li>
            <li>• Serve spread ≥2% per essere profittevole con piccoli importi</li>
            <li>• Tutto deve eseguire in 1 blocco (~13s) o fallisce automaticamente</li>
            <li>• Consigliato solo con capitale virtuale ≥$50,000</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
