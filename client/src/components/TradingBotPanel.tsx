import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Bot, Settings, TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function TradingBotPanel() {
  const { toast } = useToast();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Fetch bot config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["/api/bot/config"],
  });

  // Fetch bot stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/bot/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await fetch("/api/bot/config", {
        method: "POST",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/stats"] });
      toast({
        title: "✅ Configurazione salvata",
        description: "Le impostazioni del bot sono state aggiornate",
      });
      setIsConfigOpen(false);
    },
    onError: () => {
      toast({
        title: "❌ Errore",
        description: "Impossibile salvare la configurazione",
        variant: "destructive",
      });
    },
  });

  const handleToggleBot = (enabled: boolean) => {
    updateConfigMutation.mutate({ enabled });
  };

  const handleModeChange = (mode: string) => {
    updateConfigMutation.mutate({ mode });
  };

  if (configLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Trading Bot Automatico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = config?.enabled || false;
  const mode = config?.mode || "conservative";

  return (
    <Card data-testid="card-trading-bot">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Trading Bot Automatico</CardTitle>
            {isEnabled && (
              <Badge variant="default" className="ml-2 animate-pulse">
                ATTIVO
              </Badge>
            )}
          </div>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bot-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurazione Bot</DialogTitle>
                <DialogDescription>
                  Imposta i parametri per il trading automatico
                </DialogDescription>
              </DialogHeader>
              <BotConfigForm config={config} onSave={(updates) => updateConfigMutation.mutate(updates)} />
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          {isEnabled ? "Il bot sta monitorando le opportunità 24/7" : "Attiva il bot per trading automatico"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Switch */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="bot-enabled" className="text-base font-semibold">
              Abilita Bot
            </Label>
            <p className="text-sm text-muted-foreground">
              Esegui trade automaticamente quando trova opportunità
            </p>
          </div>
          <Switch
            id="bot-enabled"
            checked={isEnabled}
            onCheckedChange={handleToggleBot}
            data-testid="switch-bot-enabled"
          />
        </div>

        {/* Mode Selection */}
        {isEnabled && (
          <div className="space-y-2">
            <Label>Modalità Trading</Label>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger data-testid="select-bot-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">🛡️ Conservativa - Min rischio</SelectItem>
                <SelectItem value="aggressive">🚀 Aggressiva - Max profitto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trade Oggi</p>
              <p className="text-2xl font-bold" data-testid="text-trades-today">
                {stats.tradesExecutedToday || 0}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profitto Oggi</p>
              <p className="text-2xl font-bold text-primary" data-testid="text-profit-today">
                ${(stats.profitToday || 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{(stats.winRate || 0).toFixed(1)}%</p>
                {stats.winRate >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rimanenti</p>
              <p className="text-xl font-bold">
                {stats.remainingTrades || 0}/{config?.maxDailyTrades || 20}
              </p>
            </div>
          </div>
        )}

        {/* Configuration Summary */}
        {isEnabled && config && (
          <div className="space-y-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs font-semibold text-primary">Configurazione Attiva</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Min Profitto: {config.minProfitPercent}%</div>
              <div>Max Trade/Giorno: {config.maxDailyTrades}</div>
              <div>Position Size: {config.positionSizePercent}%</div>
              <div>Cooldown: {config.cooldownSeconds}s</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BotConfigForm({ config, onSave }: { config: any; onSave: (updates: any) => void }) {
  const [formData, setFormData] = useState({
    minProfitPercent: config?.minProfitPercent || 1.0,
    maxDailyTrades: config?.maxDailyTrades || 20,
    maxDailyProfit: config?.maxDailyProfit || 50,
    positionSizePercent: config?.positionSizePercent || 10,
    cooldownSeconds: config?.cooldownSeconds || 60,
    tradingHoursStart: config?.tradingHoursStart || 0,
    tradingHoursEnd: config?.tradingHoursEnd || 23,
    stopOnConsecutiveLosses: config?.stopOnConsecutiveLosses || 3,
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Profitto Minimo (%)</Label>
        <Slider
          value={[formData.minProfitPercent]}
          onValueChange={(v) => setFormData({ ...formData, minProfitPercent: v[0] })}
          min={0.5}
          max={5}
          step={0.1}
          data-testid="slider-min-profit"
        />
        <p className="text-sm text-muted-foreground">{formData.minProfitPercent.toFixed(1)}%</p>
      </div>

      <div className="space-y-2">
        <Label>Max Trade Giornalieri</Label>
        <Input
          type="number"
          value={formData.maxDailyTrades}
          onChange={(e) => setFormData({ ...formData, maxDailyTrades: parseInt(e.target.value) })}
          min={1}
          max={100}
          data-testid="input-max-daily-trades"
        />
      </div>

      <div className="space-y-2">
        <Label>Max Profitto Giornaliero ($)</Label>
        <Input
          type="number"
          value={formData.maxDailyProfit}
          onChange={(e) => setFormData({ ...formData, maxDailyProfit: parseFloat(e.target.value) })}
          min={10}
          max={500}
          data-testid="input-max-daily-profit"
        />
      </div>

      <div className="space-y-2">
        <Label>Position Size (%)</Label>
        <Slider
          value={[formData.positionSizePercent]}
          onValueChange={(v) => setFormData({ ...formData, positionSizePercent: v[0] })}
          min={5}
          max={50}
          step={5}
          data-testid="slider-position-size"
        />
        <p className="text-sm text-muted-foreground">{formData.positionSizePercent}% del capitale per trade</p>
      </div>

      <div className="space-y-2">
        <Label>Cooldown tra Trade (secondi)</Label>
        <Input
          type="number"
          value={formData.cooldownSeconds}
          onChange={(e) => setFormData({ ...formData, cooldownSeconds: parseInt(e.target.value) })}
          min={10}
          max={300}
          data-testid="input-cooldown"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ora Inizio (0-23)</Label>
          <Input
            type="number"
            value={formData.tradingHoursStart}
            onChange={(e) => setFormData({ ...formData, tradingHoursStart: parseInt(e.target.value) })}
            min={0}
            max={23}
          />
        </div>
        <div className="space-y-2">
          <Label>Ora Fine (0-23)</Label>
          <Input
            type="number"
            value={formData.tradingHoursEnd}
            onChange={(e) => setFormData({ ...formData, tradingHoursEnd: parseInt(e.target.value) })}
            min={0}
            max={23}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Stop su Perdite Consecutive</Label>
        <Input
          type="number"
          value={formData.stopOnConsecutiveLosses}
          onChange={(e) => setFormData({ ...formData, stopOnConsecutiveLosses: parseInt(e.target.value) })}
          min={1}
          max={10}
        />
      </div>

      <Button onClick={handleSave} className="w-full" data-testid="button-save-bot-config">
        Salva Configurazione
      </Button>
    </div>
  );
}
