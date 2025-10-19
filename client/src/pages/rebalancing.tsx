import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, RefreshCw, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { SUPPORTED_EXCHANGES } from "@shared/schema";

export default function Rebalancing() {
  const { toast } = useToast();

  const { data: status, isLoading } = useQuery({
    queryKey: ["/api/rebalance/status"],
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/rebalance/optimize", {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rebalance/status"] });
      toast({
        title: "✅ Ottimizzazione completata",
        description: data.message || "Capital allocation ottimizzata",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/rebalance/execute", {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rebalance/status"] });
      toast({
        title: "✅ Rebalancing eseguito",
        description: data.message || "Fondi redistribuiti con successo",
      });
    },
  });

  const balances = (status as any)?.balances || [];
  const totalBalance = balances.reduce((sum: number, b: any) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1" data-testid="text-title">
                Auto-Rebalancing
              </h1>
              <p className="text-sm text-muted-foreground">
                Ottimizzazione automatica del capitale tra exchange
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => optimizeMutation.mutate()}
                disabled={optimizeMutation.isPending}
                data-testid="button-optimize"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Ottimizza
              </Button>
              <Button
                size="sm"
                onClick={() => executeMutation.mutate()}
                disabled={executeMutation.isPending}
                data-testid="button-execute"
              >
                <Zap className="h-4 w-4 mr-2" />
                Esegui
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Capitale Totale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary" data-testid="text-total-capital">
                ${totalBalance.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Distribuito su {balances.length} exchange
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Efficienza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-primary">
                {(status as any)?.efficiency || 0}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Capital allocation score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ultimo Rebalancing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {(status as any)?.lastRebalance
                  ? new Date((status as any).lastRebalance).toLocaleDateString("it-IT")
                  : "Mai eseguito"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {(status as any)?.lastRebalance
                  ? new Date((status as any).lastRebalance).toLocaleTimeString("it-IT")
                  : "Esegui il primo rebalancing"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Capitale per Exchange</CardTitle>
            <CardDescription>Balance corrente su ogni exchange</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : balances.length > 0 ? (
              <div className="space-y-4">
                {balances.map((balance: any) => {
                  const exchange = SUPPORTED_EXCHANGES.find((e) => e.id === balance.exchange);
                  const percentage = (balance.amount / totalBalance) * 100;

                  return (
                    <div key={balance.exchange} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{exchange?.name || balance.exchange}</span>
                          <span className="text-sm text-muted-foreground">
                            {exchange?.type === "CEX" ? "CEX" : "DEX"}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">${balance.amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessun balance disponibile. Connetti gli exchange.
              </div>
            )}
          </CardContent>
        </Card>

        {(status as any)?.suggestions && (status as any).suggestions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Suggerimenti Ottimizzazione</CardTitle>
              <CardDescription>Azioni consigliate per migliorare l'allocazione</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(status as any).suggestions.map((suggestion: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
                  >
                    <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
