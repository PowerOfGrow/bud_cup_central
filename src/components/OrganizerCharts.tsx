import { lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";

// Lazy load recharts
const RechartsCharts = lazy(async () => {
  const recharts = await import("recharts");
  const {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
  } = recharts;

  return {
    default: ({
      timelineData,
      contestsData,
    }: {
      timelineData: any[];
      contestsData: any[];
    }) => (
      <>
        {/* Graphique d'évolution temporelle */}
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Évolution (30 derniers jours)</CardTitle>
            <CardDescription>Activité quotidienne sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Entrées" stroke="hsl(var(--accent))" strokeWidth={2} />
                <Line type="monotone" dataKey="Votes" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="Scores" stroke="hsl(var(--secondary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistiques par concours */}
        <Card className="border-border/70">
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={contestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Entrées" fill="hsl(var(--accent))" />
                <Bar dataKey="Votes" fill="hsl(var(--primary))" />
                <Bar dataKey="Score Moyen" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </>
    ),
  };
});

interface OrganizerChartsProps {
  timelineData: any[];
  contestsData: any[];
}

export const OrganizerCharts = ({ timelineData, contestsData }: OrganizerChartsProps) => {
  return (
    <Suspense fallback={<LoadingState message="Chargement des graphiques…" />}>
      <RechartsComponents timelineData={timelineData} contestsData={contestsData} />
    </Suspense>
  );
};

