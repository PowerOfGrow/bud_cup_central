import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { differenceInDays, differenceInHours, formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ContestDeadline {
  contest_id: string;
  contest_name: string;
  contest_status: string;
  registration_close_date: string | null;
  start_date: string | null;
  end_date: string | null;
  entries_count?: number;
  max_entries?: number;
}

interface DeadlineTrackerProps {
  deadlines: ContestDeadline[];
  className?: string;
}

export const DeadlineTracker = ({ deadlines, className }: DeadlineTrackerProps) => {
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    
    return deadlines
      .filter((d) => {
        const regClose = d.registration_close_date ? new Date(d.registration_close_date) : null;
        return regClose && regClose > now && d.contest_status === "registration";
      })
      .sort((a, b) => {
        const dateA = a.registration_close_date ? new Date(a.registration_close_date).getTime() : Infinity;
        const dateB = b.registration_close_date ? new Date(b.registration_close_date).getTime() : Infinity;
        return dateA - dateB;
      })
      .slice(0, 3); // Afficher les 3 prochaines échéances
  }, [deadlines]);

  const getDeadlineStatus = (deadlineDate: string | null) => {
    if (!deadlineDate) return null;
    
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);
    
    if (hoursLeft < 0) return { status: "passed", label: "Échéance passée", color: "destructive" };
    if (hoursLeft < 24) return { status: "urgent", label: "Urgent", color: "destructive" };
    if (daysLeft <= 3) return { status: "soon", label: "Bientôt", color: "warning" };
    if (daysLeft <= 7) return { status: "approaching", label: "Approche", color: "default" };
    return { status: "ok", label: "En temps", color: "secondary" };
  };

  const getProgressPercentage = (deadlineDate: string | null, startDate: string | null) => {
    if (!deadlineDate || !startDate) return 0;
    
    const now = new Date();
    const start = new Date(startDate);
    const deadline = new Date(deadlineDate);
    
    const totalDuration = deadline.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    if (totalDuration <= 0) return 100;
    if (elapsed < 0) return 0;
    
    const percentage = (elapsed / totalDuration) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  if (upcomingDeadlines.length === 0) {
    return (
      <Card className={cn("border-border/70 bg-muted/40", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Échéances
          </CardTitle>
          <CardDescription>Aucune échéance imminente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Toutes vos échéances sont à jour.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/70 bg-muted/40", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Échéances d'inscription
        </CardTitle>
        <CardDescription>Concours avec dates limites d'inscription à venir</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingDeadlines.map((deadline) => {
          const deadlineStatus = getDeadlineStatus(deadline.registration_close_date);
          const progress = getProgressPercentage(
            deadline.registration_close_date,
            deadline.start_date
          );
          
          const now = new Date();
          const deadlineDate = deadline.registration_close_date ? new Date(deadline.registration_close_date) : null;
          const daysLeft = deadlineDate ? differenceInDays(deadlineDate, now) : null;
          const hoursLeft = deadlineDate ? differenceInHours(deadlineDate, now) : null;
          
          return (
            <Card key={deadline.contest_id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{deadline.contest_name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {deadlineDate
                          ? format(deadlineDate, "PPP", { locale: fr })
                          : "Date non définie"}
                      </span>
                    </div>
                  </div>
                  {deadlineStatus && (
                    <Badge variant={deadlineStatus.color as any} className="ml-2">
                      {deadlineStatus.label}
                    </Badge>
                  )}
                </div>

                {/* Barre de progression */}
                {deadline.start_date && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Période d'inscription</span>
                      <span>{Math.round(progress)}% écoulé</span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Compteur de temps restant */}
                {deadlineDate && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-sm">
                      {hoursLeft !== null && hoursLeft < 48 && (
                        <div className={cn(
                          "flex items-center gap-1",
                          hoursLeft < 24 && "text-destructive font-semibold"
                        )}>
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            {hoursLeft < 0 
                              ? "Échéance passée"
                              : hoursLeft < 24
                              ? `${hoursLeft} heure${hoursLeft > 1 ? "s" : ""} restante${hoursLeft > 1 ? "s" : ""}`
                              : daysLeft !== null
                              ? `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`
                              : ""}
                          </span>
                        </div>
                      )}
                      {daysLeft !== null && daysLeft >= 2 && (
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(deadlineDate, { addSuffix: true, locale: fr })}
                        </div>
                      )}
                    </div>
                    {deadline.entries_count !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        {deadline.entries_count} entrée{deadline.entries_count > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/submit-entry/${deadline.contest_id}`}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Soumettre une entrée
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/contests?contest=${deadline.contest_id}`}>
                      Voir le concours
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

