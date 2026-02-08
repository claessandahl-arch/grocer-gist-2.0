import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Anomaly {
  anomaly_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_item?: {
    name: string;
    price: number;
    quantity: number;
  };
  store_name: string;
  created_at: string;
}

interface ParserHealthMetric {
  month: string;
  total_receipts: number;
  receipts_with_anomalies: number;
  health_score: number;
  avg_processing_time_ms: number;
}

interface AnomalyTypeStats {
  anomaly_type: string;
  occurrence_count: number;
  last_seen: string;
}

export function ParserHealthDashboard() {
  const { data: healthMetrics } = useQuery({
    queryKey: ['parser-health-metrics'],
    queryFn: async () => {
      // Views not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('parser_health_metrics')
        .select('*')
        .order('month', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data as ParserHealthMetric[];
    }
  });

  const { data: recentAnomalies } = useQuery({
    queryKey: ['recent-anomalies'],
    queryFn: async () => {
      // Views not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('parser_anomalies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Anomaly[];
    }
  });

  const { data: anomalyTypes } = useQuery({
    queryKey: ['anomaly-type-breakdown'],
    queryFn: async () => {
      // Views not yet in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('anomaly_type_breakdown')
        .select('*')
        .order('occurrence_count', { ascending: false });
      
      if (error) throw error;
      return data as AnomalyTypeStats[];
    }
  });

  const currentHealth = healthMetrics?.[0];
  const healthScore = currentHealth?.health_score ?? 100;
  
  const getScoreColor = (score: number) => {
    if (score >= 95) return "text-green-500";
    if (score >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Kritisk</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-500">Hög</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medel</Badge>;
      default: return <Badge variant="outline">Låg</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hälsostatus Parser
            </CardTitle>
            <Activity className={`h-4 w-4 ${getScoreColor(healthScore)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {currentHealth?.receipts_with_anomalies || 0} problem i senaste {currentHealth?.total_receipts || 0} kvitton
            </p>
            <Progress value={healthScore} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Snittbehandlingstid
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentHealth?.avg_processing_time_ms ? `${(currentHealth.avg_processing_time_ms / 1000).toFixed(1)}s` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per kvitto (senaste 30 dagarna)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Senaste Avvikelser</CardTitle>
            <CardDescription>
              Problem upptäckta i nyligen uppladdade kvitton
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnomalies?.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Inga avvikelser upptäckta
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {recentAnomalies?.map((anomaly, idx) => (
                  <div key={idx} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{anomaly.anomaly_type}</span>
                      {getSeverityBadge(anomaly.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{anomaly.store_name}</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(anomaly.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Vanliga Problem</CardTitle>
            <CardDescription>
              Vanligaste feltyperna (senaste 30 dagarna)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalyTypes?.map((type, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    <span className="text-sm font-medium">{type.anomaly_type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">{type.occurrence_count}</span>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {new Date(type.last_seen).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {anomalyTypes?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Inga problem registrerade än.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
