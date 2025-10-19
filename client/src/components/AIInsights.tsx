import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Lightbulb, Clock, Target, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ArbitrageOpportunity } from "@shared/schema";

export function AIInsights({ opportunities }: { opportunities: ArbitrageOpportunity[] }) {
  const { toast } = useToast();

  // Fetch AI predictions
  const { data: predictions } = useQuery({
    queryKey: ["/api/ai/predictions"],
  });

  // Fetch detected patterns
  const { data: patterns } = useQuery({
    queryKey: ["/api/ai/patterns"],
  });

  // Get AI recommendations
  const { data: recommendations } = useQuery({
    queryKey: ["/api/ai/recommendations", opportunities.length],
    queryFn: async () => {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        body: JSON.stringify({ opportunities }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    enabled: opportunities.length > 0,
  });

  // Detect patterns mutation
  const detectPatternsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/detect-patterns", {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/patterns"] });
      toast({
        title: "✅ Pattern rilevati",
        description: "Nuovi pattern identificati nei dati storici",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* AI Recommendations */}
      <Card data-testid="card-ai-recommendations">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => detectPatternsMutation.mutate()}
              disabled={detectPatternsMutation.isPending}
              data-testid="button-detect-patterns"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Rileva Pattern
            </Button>
          </div>
          <CardDescription>Suggerimenti basati su AI e pattern detection</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.recommendations.map((rec: string, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
                  data-testid={`recommendation-${idx}`}
                >
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nessuna raccomandazione al momento
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Price Predictions */}
        <Card data-testid="card-ai-predictions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predizioni Prezzi
            </CardTitle>
            <CardDescription>ML-based price forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            {predictions && predictions.length > 0 ? (
              <div className="space-y-3">
                {predictions.slice(0, 5).map((pred: any) => (
                  <div key={pred.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-semibold">{pred.pair}</span>
                      <Badge variant="outline">
                        {(pred.confidence * 100).toFixed(0)}% confidenza
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">1h</p>
                        <p className="font-semibold">${pred.predicted1h?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">6h</p>
                        <p className="font-semibold">${pred.predicted6h?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">24h</p>
                        <p className="font-semibold">${pred.predicted24h?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessuna predizione disponibile
              </p>
            )}
          </CardContent>
        </Card>

        {/* Detected Patterns */}
        <Card data-testid="card-detected-patterns">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pattern Rilevati
            </CardTitle>
            <CardDescription>Pattern storici identificati dall'AI</CardDescription>
          </CardHeader>
          <CardContent>
            {patterns && patterns.length > 0 ? (
              <div className="space-y-3">
                {patterns.slice(0, 5).map((pattern: any) => (
                  <div key={pattern.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      {pattern.patternType === 'high_activity_hour' && <Clock className="h-4 w-4 text-primary" />}
                      {pattern.patternType === 'profitable_exchange_pair' && <TrendingUp className="h-4 w-4 text-primary" />}
                      {pattern.patternType === 'high_volatility_pair' && <Target className="h-4 w-4 text-primary" />}
                      <span className="text-sm font-semibold">
                        {pattern.patternType.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {(pattern.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    {pattern.expectedProfitPercent && (
                      <p className="text-xs text-primary mt-1">
                        Profitto atteso: {pattern.expectedProfitPercent.toFixed(2)}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nessun pattern rilevato ancora
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
