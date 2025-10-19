import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Zap, Percent } from "lucide-react";
import { useState } from "react";

export function MultiStrategyCalculator() {
  const [capital, setCapital] = useState(100);
  const [tradesPerDay, setTradesPerDay] = useState(3);
  const [avgProfitPercent, setAvgProfitPercent] = useState(2.5);

  // Strategia 1: Arbitraggio
  const arbitrageDailyProfit = (capital * (avgProfitPercent / 100) * tradesPerDay) - (tradesPerDay * 0.20); // -$0.20 fee per trade
  const arbitrageMonthlyProfit = arbitrageDailyProfit * 30;

  // Strategia 2: Yield Farming (Staking + LP)
  const stakingCapital = capital * 0.5; // 50% in staking
  const lpCapital = capital * 0.3; // 30% in LP
  const stakingAPY = 6; // 6% annuo
  const lpAPY = 40; // 40% annuo
  
  const stakingDailyProfit = (stakingCapital * (stakingAPY / 100)) / 365;
  const lpDailyProfit = (lpCapital * (lpAPY / 100)) / 365;
  const yieldDailyProfit = stakingDailyProfit + lpDailyProfit;
  const yieldMonthlyProfit = yieldDailyProfit * 30;

  // Strategia 3: Flash Loans (conservativa: 2 flash loan/settimana)
  const flashLoansPerWeek = 2;
  const avgFlashLoanProfit = 15; // $15 per flash loan (conservativo)
  const flashLoanMonthlyProfit = (flashLoansPerWeek * avgFlashLoanProfit * 4.33); // 4.33 settimane/mese

  // Totali
  const totalDailyProfit = arbitrageDailyProfit + yieldDailyProfit + (flashLoanMonthlyProfit / 30);
  const totalMonthlyProfit = arbitrageMonthlyProfit + yieldMonthlyProfit + flashLoanMonthlyProfit;
  const monthlyROI = (totalMonthlyProfit / capital) * 100;

  // Proiezioni
  const month3Capital = capital + (totalMonthlyProfit * 3);
  const month6Capital = capital + (totalMonthlyProfit * 6);
  const month12Capital = capital + (totalMonthlyProfit * 12);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-multi-strategy">
          <TrendingUp className="h-4 w-4" />
          Calcolatore Multi-Strategia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-multi-strategy">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Calcolatore Profitti Multi-Strategia
          </DialogTitle>
          <DialogDescription>
            Calcola quanto puoi guadagnare combinando 3 strategie contemporaneamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Input Parameters */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Parametri di Base</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capital" className="text-sm">
                  Capitale Iniziale ($)
                </Label>
                <Input
                  id="capital"
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  min="50"
                  max="10000"
                  data-testid="input-capital"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trades" className="text-sm">
                  Arbitraggi al Giorno
                </Label>
                <Input
                  id="trades"
                  type="number"
                  value={tradesPerDay}
                  onChange={(e) => setTradesPerDay(Number(e.target.value))}
                  min="1"
                  max="20"
                  data-testid="input-trades"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profit" className="text-sm">
                  Profitto Medio (%)
                </Label>
                <Input
                  id="profit"
                  type="number"
                  step="0.1"
                  value={avgProfitPercent}
                  onChange={(e) => setAvgProfitPercent(Number(e.target.value))}
                  min="0.5"
                  max="10"
                  data-testid="input-profit-percent"
                />
              </div>
            </div>
          </Card>

          {/* Risultati Giornalieri */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">
                ${totalDailyProfit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Profitto/Giorno</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-xl font-bold text-green-600">
                ${arbitrageDailyProfit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Arbitraggio</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-xl font-bold text-blue-600">
                ${yieldDailyProfit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Yield Farming</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-xl font-bold text-purple-600">
                ${(flashLoanMonthlyProfit / 30).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Flash Loans</div>
            </Card>
          </div>

          {/* Risultati Mensili */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Proiezione Mensile</h3>
              <Badge variant="default" className="text-lg px-3 py-1">
                ROI: +{monthlyROI.toFixed(0)}%
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                  <span className="text-sm">Arbitraggio (30 giorni)</span>
                  <span className="font-bold text-green-600">+${arbitrageMonthlyProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                  <span className="text-sm">Yield Farming Passivo</span>
                  <span className="font-bold text-blue-600">+${yieldMonthlyProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                  <span className="text-sm">Flash Loans (8-10 ops)</span>
                  <span className="font-bold text-purple-600">+${flashLoanMonthlyProfit.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex flex-col justify-center items-center p-6 bg-primary/10 rounded-lg border-2 border-primary/30">
                <div className="text-sm text-muted-foreground mb-2">PROFITTO TOTALE MENSILE</div>
                <div className="text-4xl font-bold text-primary">
                  ${totalMonthlyProfit.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Da capitale di ${capital}
                </div>
              </div>
            </div>
          </Card>

          {/* Proiezioni Temporali */}
          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="breakdown">Dettagli Strategia</TabsTrigger>
              <TabsTrigger value="projections">Proiezioni Crescita</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-4 mt-4">
              <StrategyBreakdown
                name="💹 Arbitraggio Crypto"
                description="Trading rapido tra exchange CEX"
                metrics={[
                  { label: "Capitale Allocato", value: `$${capital * 0.7}` },
                  { label: "Operazioni/Giorno", value: tradesPerDay.toString() },
                  { label: "Profitto Medio/Trade", value: `${avgProfitPercent}%` },
                  { label: "Commissioni/Trade", value: "$0.20" },
                ]}
                dailyProfit={arbitrageDailyProfit}
                monthlyProfit={arbitrageMonthlyProfit}
              />

              <StrategyBreakdown
                name="🌾 Yield Farming Passivo"
                description="Staking + Liquidity Providing"
                metrics={[
                  { label: "Staking CEX (50%)", value: `$${stakingCapital.toFixed(2)} @ ${stakingAPY}% APY` },
                  { label: "LP PancakeSwap (30%)", value: `$${lpCapital.toFixed(2)} @ ${lpAPY}% APY` },
                  { label: "Rendimento Giornaliero", value: `$${yieldDailyProfit.toFixed(3)}` },
                  { label: "Auto-Compound", value: "Attivo" },
                ]}
                dailyProfit={yieldDailyProfit}
                monthlyProfit={yieldMonthlyProfit}
              />

              <StrategyBreakdown
                name="⚡ Flash Loan Arbitraggio"
                description="Arbitraggio con capitale preso in prestito"
                metrics={[
                  { label: "Capitale Necessario", value: "$0 (prestito flash)" },
                  { label: "Operazioni/Settimana", value: `${flashLoansPerWeek} flash loans` },
                  { label: "Profitto/Operazione", value: `$${avgFlashLoanProfit}` },
                  { label: "Fee Flash Loan", value: "0.09% (Aave)" },
                ]}
                dailyProfit={flashLoanMonthlyProfit / 30}
                monthlyProfit={flashLoanMonthlyProfit}
              />
            </TabsContent>

            <TabsContent value="projections" className="mt-4">
              <Card className="p-6 space-y-6">
                <h3 className="font-semibold text-lg">Crescita Capitale nel Tempo</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-semibold">Dopo 3 Mesi</div>
                      <div className="text-xs text-muted-foreground">
                        +${(month3Capital - capital).toFixed(2)} profitto
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ${month3Capital.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <div className="font-semibold">Dopo 6 Mesi</div>
                      <div className="text-xs text-muted-foreground">
                        +${(month6Capital - capital).toFixed(2)} profitto
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ${month6Capital.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/30">
                    <div>
                      <div className="font-semibold">Dopo 1 Anno</div>
                      <div className="text-xs text-muted-foreground">
                        +${(month12Capital - capital).toFixed(2)} profitto
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      ${month12Capital.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
                  <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 mb-2">
                    💡 Suggerimento: Effetto Compound
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se reinvesti tutti i profitti invece di ritirarli, il tuo capitale cresce esponenzialmente.
                    Con compound attivo, dopo 1 anno potresti avere <span className="font-bold">2-3x</span> in più!
                  </p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-500">
                Come Attivare Tutte le Strategie
              </p>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 ml-7 list-decimal">
              <li>Clicca "Connessione Rapida" e connetti Bybit + MetaMask</li>
              <li>Abilita "Yield Farming Automatico" nelle impostazioni</li>
              <li>Attiva "Flash Loan Mode" (richiede capitale ≥$50)</li>
              <li>Sistema gestisce tutto automaticamente - tu raccogli profitti!</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StrategyBreakdownProps {
  name: string;
  description: string;
  metrics: { label: string; value: string }[];
  dailyProfit: number;
  monthlyProfit: number;
}

function StrategyBreakdown({ name, description, metrics, dailyProfit, monthlyProfit }: StrategyBreakdownProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary">${dailyProfit.toFixed(2)}/giorno</div>
          <div className="text-xs text-muted-foreground">${monthlyProfit.toFixed(2)}/mese</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex justify-between items-center p-2 bg-muted/20 rounded text-xs">
            <span className="text-muted-foreground">{metric.label}:</span>
            <span className="font-medium">{metric.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
