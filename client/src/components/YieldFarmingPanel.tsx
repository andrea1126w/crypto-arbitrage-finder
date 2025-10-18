import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TrendingUp, DollarSign, Percent, Clock } from "lucide-react";
import { useState } from "react";

interface StakingPosition {
  asset: string;
  amount: number;
  apy: number;
  dailyEarnings: number;
  platform: string;
  autoCompound: boolean;
}

export function YieldFarmingPanel() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [positions, setPositions] = useState<StakingPosition[]>([
    { asset: "BTC", amount: 0.002, apy: 5, dailyEarnings: 0.00027, platform: "Binance Earn", autoCompound: true },
    { asset: "ETH", amount: 0.05, apy: 6.5, dailyEarnings: 0.0089, platform: "Binance Earn", autoCompound: true },
    { asset: "USDT", amount: 50, apy: 8, dailyEarnings: 0.011, platform: "Binance Earn", autoCompound: false },
  ]);

  const totalDailyEarnings = positions.reduce((sum, p) => sum + (p.dailyEarnings * (p.amount > 0 ? 1 : 0)), 0);
  const totalMonthlyEarnings = totalDailyEarnings * 30;
  const totalValue = positions.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card className="p-6" data-testid="panel-yield-farming">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">🌾 Yield Farming Passivo</h2>
            <p className="text-sm text-muted-foreground">
              Guadagna interessi mentre aspetti opportunità di arbitraggio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="yield-toggle" className="text-sm font-medium">
              {isEnabled ? "Attivo" : "Disattivato"}
            </Label>
            <Switch
              id="yield-toggle"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              data-testid="switch-yield-farming"
            />
          </div>
        </div>

        {!isEnabled ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">💤</div>
            <div>
              <p className="text-lg font-semibold mb-2">Yield Farming Non Attivo</p>
              <p className="text-sm text-muted-foreground mb-4">
                Attiva per guadagnare rendimento passivo sui fondi non utilizzati
              </p>
              <Button
                onClick={() => setIsEnabled(true)}
                variant="default"
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Attiva Yield Farming
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Valore Totale</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  ${totalValue.toFixed(2)}
                </div>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Rendimento/Giorno</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${totalDailyEarnings.toFixed(3)}
                </div>
              </Card>

              <Card className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Proiezione/Mese</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalMonthlyEarnings.toFixed(2)}
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Posizioni Attive</h3>
              {positions.map((position, idx) => (
                <Card
                  key={position.asset}
                  className="p-4 hover-elevate"
                  data-testid={`card-staking-${position.asset}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {position.asset === "BTC" ? "₿" : position.asset === "ETH" ? "Ξ" : "💵"}
                      </div>
                      <div>
                        <div className="font-semibold">{position.asset}</div>
                        <div className="text-xs text-muted-foreground">{position.platform}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-mono">{position.amount} {position.asset}</div>
                        <div className="text-xs text-muted-foreground">Staked</div>
                      </div>

                      <div className="text-right">
                        <Badge variant="default" className="gap-1">
                          <Percent className="h-3 w-3" />
                          {position.apy}% APY
                        </Badge>
                        <div className="text-xs text-green-600 mt-1 font-medium">
                          +${position.dailyEarnings.toFixed(3)}/giorno
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`auto-compound-${idx}`} className="text-xs text-muted-foreground">
                          Auto-Compound
                        </Label>
                        <Switch
                          id={`auto-compound-${idx}`}
                          checked={position.autoCompound}
                          onCheckedChange={(checked) => {
                            const newPositions = [...positions];
                            newPositions[idx].autoCompound = checked;
                            setPositions(newPositions);
                          }}
                          data-testid={`switch-compound-${position.asset}`}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-500 mb-2">
                💡 Come Funziona
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• I fondi non utilizzati per arbitraggio vengono automaticamente messi in staking</li>
                <li>• Guadagni interessi giornalieri senza fare nulla</li>
                <li>• Auto-compound reinveste automaticamente i guadagni per massimizzare profitti</li>
                <li>• Fondi disponibili immediatamente quando serve capitale per arbitraggio</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
