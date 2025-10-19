import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, DollarSign, Bell, Shield } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-title">
              Impostazioni
            </h1>
            <p className="text-sm text-muted-foreground">
              Configura le preferenze generali dell'applicazione
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Capitale di Trading
            </CardTitle>
            <CardDescription>
              Configura il capitale disponibile per il trading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capital">Capitale Totale (USD)</Label>
              <Input
                id="capital"
                type="number"
                defaultValue="100"
                placeholder="100"
                data-testid="input-capital"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-compound profitti</Label>
                <p className="text-sm text-muted-foreground">
                  Reinvesti automaticamente i profitti
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-auto-compound" />
            </div>

            <Button data-testid="button-save-capital">Salva Impostazioni</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifiche
            </CardTitle>
            <CardDescription>
              Gestisci le preferenze di notifica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifiche Browser</Label>
                <p className="text-sm text-muted-foreground">
                  Ricevi notifiche nel browser
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-browser-notifications" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Suoni</Label>
                <p className="text-sm text-muted-foreground">
                  Riproduci suono per nuove opportunità
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-sound" />
            </div>

            <Button data-testid="button-save-notifications">Salva Preferenze</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sicurezza
            </CardTitle>
            <CardDescription>
              Protezione account e dati sensibili
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Richiedi conferma per trade</Label>
                <p className="text-sm text-muted-foreground">
                  Conferma manuale prima di ogni trade
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-confirm-trades" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Logout automatico</Label>
                <p className="text-sm text-muted-foreground">
                  Disconnetti dopo 30 minuti di inattività
                </p>
              </div>
              <Switch data-testid="switch-auto-logout" />
            </div>

            <Button variant="destructive" data-testid="button-clear-api-keys">
              Cancella tutte le API Keys
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Avanzate
            </CardTitle>
            <CardDescription>
              Opzioni avanzate per utenti esperti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Modalità Debug</Label>
                <p className="text-sm text-muted-foreground">
                  Mostra log dettagliati nella console
                </p>
              </div>
              <Switch data-testid="switch-debug" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Demo Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Simula trading senza eseguire ordini reali
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-demo-mode" />
            </div>

            <Button variant="outline" data-testid="button-reset-settings">
              Reset Impostazioni Default
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
