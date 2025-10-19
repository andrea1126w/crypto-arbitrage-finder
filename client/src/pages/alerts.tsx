import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, TestTube, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Alerts() {
  const { toast } = useToast();
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [emailSmtp, setEmailSmtp] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailTo, setEmailTo] = useState("");

  const { data: config } = useQuery({
    queryKey: ["/api/alerts/config"],
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/config"] });
      toast({
        title: "✅ Configurazione salvata",
        description: "Le impostazioni degli alert sono state aggiornate",
      });
    },
  });

  const testAlertMutation = useMutation({
    mutationFn: async (channel: string) => {
      const res = await fetch("/api/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🔔 Test inviato",
        description: data.message || "Notifica di test inviata con successo",
      });
    },
    onError: () => {
      toast({
        title: "❌ Errore",
        description: "Impossibile inviare la notifica di test",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-title">
              Sistema Alert Avanzato
            </h1>
            <p className="text-sm text-muted-foreground">
              Configura notifiche multi-canale: Telegram, Discord, Email
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="telegram" className="space-y-6">
          <TabsList>
            <TabsTrigger value="telegram" data-testid="tab-telegram">
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="discord" data-testid="tab-discord">
              <Bell className="h-4 w-4 mr-2" />
              Discord
            </TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">
              <Send className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="triggers" data-testid="tab-triggers">
              <History className="h-4 w-4 mr-2" />
              Triggers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="telegram">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Telegram</CardTitle>
                <CardDescription>
                  Configura il bot Telegram per ricevere notifiche istantanee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="telegram-token">Bot Token</Label>
                  <Input
                    id="telegram-token"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={telegramToken}
                    onChange={(e) => setTelegramToken(e.target.value)}
                    data-testid="input-telegram-token"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ottieni il token da @BotFather su Telegram
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-chat-id">Chat ID</Label>
                  <Input
                    id="telegram-chat-id"
                    placeholder="123456789"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    data-testid="input-telegram-chat-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa @userinfobot per ottenere il tuo Chat ID
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => saveConfigMutation.mutate({ telegramToken, telegramChatId })}
                    disabled={saveConfigMutation.isPending}
                    data-testid="button-save-telegram"
                  >
                    Salva Configurazione
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testAlertMutation.mutate("telegram")}
                    disabled={testAlertMutation.isPending}
                    data-testid="button-test-telegram"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Notifica
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discord">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Discord</CardTitle>
                <CardDescription>
                  Configura webhook Discord per notifiche nel tuo server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="discord-webhook">Webhook URL</Label>
                  <Input
                    id="discord-webhook"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={discordWebhook}
                    onChange={(e) => setDiscordWebhook(e.target.value)}
                    data-testid="input-discord-webhook"
                  />
                  <p className="text-xs text-muted-foreground">
                    Crea un webhook nelle impostazioni del canale Discord
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => saveConfigMutation.mutate({ discordWebhook })}
                    disabled={saveConfigMutation.isPending}
                    data-testid="button-save-discord"
                  >
                    Salva Configurazione
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testAlertMutation.mutate("discord")}
                    disabled={testAlertMutation.isPending}
                    data-testid="button-test-discord"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Notifica
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Configurazione Email</CardTitle>
                <CardDescription>
                  Configura SMTP per ricevere alert via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-smtp">Server SMTP</Label>
                  <Input
                    id="email-smtp"
                    placeholder="smtp.gmail.com:587"
                    value={emailSmtp}
                    onChange={(e) => setEmailSmtp(e.target.value)}
                    data-testid="input-email-smtp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-from">Email mittente</Label>
                  <Input
                    id="email-from"
                    type="email"
                    placeholder="alerts@example.com"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    data-testid="input-email-from"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-to">Email destinatario</Label>
                  <Input
                    id="email-to"
                    type="email"
                    placeholder="you@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    data-testid="input-email-to"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => saveConfigMutation.mutate({ emailSmtp, emailFrom, emailTo })}
                    disabled={saveConfigMutation.isPending}
                    data-testid="button-save-email"
                  >
                    Salva Configurazione
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => testAlertMutation.mutate("email")}
                    disabled={testAlertMutation.isPending}
                    data-testid="button-test-email"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Notifica
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers">
            <Card>
              <CardHeader>
                <CardTitle>Custom Triggers</CardTitle>
                <CardDescription>
                  Configura quando ricevere notifiche
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profitto minimo per alert</Label>
                    <p className="text-sm text-muted-foreground">
                      Ricevi notifiche solo se profitto &gt; X%
                    </p>
                  </div>
                  <Select defaultValue="1.0">
                    <SelectTrigger className="w-32" data-testid="select-min-profit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5%</SelectItem>
                      <SelectItem value="1.0">1.0%</SelectItem>
                      <SelectItem value="1.5">1.5%</SelectItem>
                      <SelectItem value="2.0">2.0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alert per nuove opportunità</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifica quando trovata nuova opportunità
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-new-opportunities" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alert esecuzione bot</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifica quando il bot esegue un trade
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-bot-execution" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Riepilogo giornaliero alle 20:00
                    </p>
                  </div>
                  <Switch data-testid="switch-daily-summary" />
                </div>

                <Button className="w-full" data-testid="button-save-triggers">
                  Salva Triggers
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
