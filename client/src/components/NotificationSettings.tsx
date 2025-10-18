import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NotificationSettingsProps {
  settings: {
    enabled: boolean;
    soundEnabled: boolean;
    minProfitPercentage: number;
  };
  permission: NotificationPermission;
  onRequestPermission: () => Promise<boolean>;
  onUpdateSettings: (settings: { enabled?: boolean; soundEnabled?: boolean; minProfitPercentage?: number }) => void;
}

export function NotificationSettings({
  settings,
  permission,
  onRequestPermission,
  onUpdateSettings,
}: NotificationSettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-notification-settings">
          {settings.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          <span className="hidden sm:inline">Notifiche</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" data-testid="modal-notification-settings">
        <DialogHeader>
          <DialogTitle className="text-xl">Impostazioni Notifiche</DialogTitle>
          <DialogDescription>
            Ricevi avvisi quando appaiono opportunità profittevoli
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {permission === "denied" && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <p className="text-sm text-destructive font-semibold mb-1">
                Notifiche Bloccate
              </p>
              <p className="text-xs text-muted-foreground">
                Hai bloccato le notifiche per questo sito. Abilitale dalle impostazioni del browser.
              </p>
            </div>
          )}

          {permission === "default" && (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-semibold mb-2">
                Abilita le Notifiche
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Clicca il pulsante per ricevere notifiche quando appaiono opportunità profittevoli.
              </p>
              <Button 
                onClick={onRequestPermission} 
                className="w-full"
                data-testid="button-enable-notifications"
              >
                <Bell className="mr-2 h-4 w-4" />
                Abilita Notifiche
              </Button>
            </div>
          )}

          {permission === "granted" && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-enabled" className="text-sm font-semibold">
                    Notifiche Browser
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ricevi notifiche per nuove opportunità
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => onUpdateSettings({ enabled })}
                  data-testid="switch-notifications"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-enabled" className="text-sm font-semibold">
                    Suono Alert
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Riproduci un suono con le notifiche
                  </p>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(soundEnabled) => onUpdateSettings({ soundEnabled })}
                  disabled={!settings.enabled}
                  data-testid="switch-sound"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Soglia Profitto Minimo
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Notifica solo opportunità sopra questa percentuale
                </p>
                <Select
                  value={settings.minProfitPercentage.toString()}
                  onValueChange={(value) => onUpdateSettings({ minProfitPercentage: parseFloat(value) })}
                  disabled={!settings.enabled}
                >
                  <SelectTrigger data-testid="select-min-profit-notification">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">&gt; 0.5%</SelectItem>
                    <SelectItem value="1">&gt; 1%</SelectItem>
                    <SelectItem value="2">&gt; 2%</SelectItem>
                    <SelectItem value="3">&gt; 3%</SelectItem>
                    <SelectItem value="5">&gt; 5%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 space-y-2">
                <p className="text-sm font-semibold">Stato Notifiche</p>
                <div className="flex items-center gap-2">
                  <Badge variant={settings.enabled ? "default" : "secondary"}>
                    {settings.enabled ? "Attive" : "Disattivate"}
                  </Badge>
                  {settings.enabled && settings.soundEnabled && (
                    <Badge variant="outline" className="gap-1">
                      <Volume2 className="h-3 w-3" />
                      Audio
                    </Badge>
                  )}
                  {settings.enabled && !settings.soundEnabled && (
                    <Badge variant="outline" className="gap-1">
                      <VolumeX className="h-3 w-3" />
                      Silenzioso
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Verrai avvisato per opportunità ≥ {settings.minProfitPercentage}%
                </p>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
            <p className="font-semibold">💡 Suggerimenti:</p>
            <ul className="space-y-1 ml-4">
              <li>• Imposta una soglia realistica (es: ≥2%) per evitare troppe notifiche</li>
              <li>• Disattiva il suono se lavori in luoghi pubblici</li>
              <li>• Le notifiche funzionano anche a scheda chiusa (se il browser lo permette)</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
