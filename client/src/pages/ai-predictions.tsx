import { useQuery } from "@tanstack/react-query";
import { AIInsights } from "@/components/AIInsights";
import type { ArbitrageOpportunity } from "@shared/schema";

export default function AIPredictions() {
  const { data: opportunities = [] } = useQuery<ArbitrageOpportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-title">
              AI Price Predictions
            </h1>
            <p className="text-sm text-muted-foreground">
              Previsioni ML, pattern detection e smart trading signals
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <AIInsights opportunities={opportunities} />
      </div>
    </div>
  );
}
