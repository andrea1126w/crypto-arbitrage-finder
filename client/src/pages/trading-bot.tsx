import { TradingBotPanel } from "@/components/TradingBotPanel";

export default function TradingBot() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-title">
              Trading Bot Automatico
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestisci il bot di trading automatico 24/7 con controlli avanzati
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <TradingBotPanel />
      </div>
    </div>
  );
}
