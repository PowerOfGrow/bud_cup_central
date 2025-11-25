import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/use-notifications";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Bell, CheckCheck, ArrowLeft, Filter, AlertCircle, Info, CheckCircle2, XCircle, 
  Gavel, Trophy, Mail, Clock, Calendar, Star, TrendingUp 
} from "lucide-react";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Icônes par type de notification
const getNotificationIcon = (type: string) => {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "entry_approved":
      return <CheckCircle2 className={`${iconClass} text-green-600`} />;
    case "entry_rejected":
      return <XCircle className={`${iconClass} text-red-600`} />;
    case "judge_assigned":
    case "judge_invitation":
      return <Gavel className={`${iconClass} text-blue-600`} />;
    case "results_published":
      return <Trophy className={`${iconClass} text-yellow-600`} />;
    case "vote_received":
      return <Star className={`${iconClass} text-purple-600`} />;
    case "score_received":
      return <TrendingUp className={`${iconClass} text-indigo-600`} />;
    case "contest_created":
    case "contest_started":
    case "contest_completed":
      return <Calendar className={`${iconClass} text-cyan-600`} />;
    default:
      return <Bell className={`${iconClass} text-gray-600`} />;
  }
};

// Badge de priorité
const PriorityBadge = ({ priority }: { priority?: number | null }) => {
  if (!priority || priority === 0) return null;
  if (priority === 2) {
    return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
  }
  if (priority === 1) {
    return <Badge variant="default" className="text-xs bg-orange-500">Important</Badge>;
  }
  return null;
};

// Formatage de la date pour le groupement
const formatDateGroup = (date: Date): string => {
  if (isToday(date)) return "Aujourd'hui";
  if (isYesterday(date)) return "Hier";
  if (isThisWeek(date)) return format(date, "EEEE", { locale: fr });
  if (isThisMonth(date)) return format(date, "d MMMM", { locale: fr });
  return format(date, "d MMMM yyyy", { locale: fr });
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotifications();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");

  // Grouper les notifications par date
  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter((n) => {
      if (filterType !== "all" && n.type !== filterType) return false;
      if (filterRead === "unread" && n.read) return false;
      if (filterRead === "read" && !n.read) return false;
      return true;
    });

    const grouped: Record<string, typeof notifications> = {};
    filtered.forEach((notification) => {
      const date = new Date(notification.created_at);
      const dateKey = formatDateGroup(date);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(notification);
    });

    // Trier les notifications dans chaque groupe (priorité puis date)
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        const priorityA = (a as any).priority || 0;
        const priorityB = (b as any).priority || 0;
        if (priorityA !== priorityB) return priorityB - priorityA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    return grouped;
  }, [notifications, filterType, filterRead]);

  // Statistiques par type
  const statsByType = useMemo(() => {
    const stats: Record<string, { total: number; unread: number }> = {};
    notifications.forEach((n) => {
      if (!stats[n.type]) {
        stats[n.type] = { total: 0, unread: 0 };
      }
      stats[n.type].total++;
      if (!n.read) stats[n.type].unread++;
    });
    return stats;
  }, [notifications]);

  // Types uniques pour le filtre
  const notificationTypes = useMemo(() => {
    return Array.from(new Set(notifications.map((n) => n.type))).sort();
  }, [notifications]);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <LoadingState message="Chargement des notifications..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
                  <p className="text-muted-foreground">
                    {unreadNotifications.length > 0 
                      ? `${unreadNotifications.length} non lue${unreadNotifications.length > 1 ? "s" : ""}`
                      : "Toutes les notifications sont lues"}
                  </p>
                </div>
              </div>
              {unreadNotifications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => markAllAsRead()}
                  disabled={isMarkingAllAsRead}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>

            {/* Filtres */}
            <div className="flex gap-4 mb-6">
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrer par état" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="unread">Non lues ({unreadNotifications.length})</SelectItem>
                  <SelectItem value="read">Lues ({readNotifications.length})</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")} ({statsByType[type]?.unread || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notifications groupées par date */}
            {Object.keys(groupedNotifications).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedNotifications).map(([dateGroup, dateNotifications]) => (
                  <div key={dateGroup}>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      {dateGroup}
                    </h2>
                    <div className="space-y-3">
                      {dateNotifications.map((notification) => (
                        <Card
                          key={notification.id}
                          className={`border-l-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                            !notification.read 
                              ? "bg-accent/5 border-l-accent" 
                              : "opacity-75 border-l-border"
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                            if (notification.link) {
                              navigate(notification.link);
                            }
                          }}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                                    <PriorityBadge priority={(notification as any).priority} />
                                    {!notification.read && (
                                      <Badge variant="default" className="bg-accent text-xs">
                                        Nouveau
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="mt-1">
                                    {notification.message}
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </p>
                              <div className="flex gap-2">
                                {(notification as any).action_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate((notification as any).action_url);
                                    }}
                                  >
                                    {(notification as any).action_label || "Action"}
                                  </Button>
                                )}
                                {notification.link && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link
                                      to={notification.link}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Voir →
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <CardTitle className="mb-2">Aucune notification</CardTitle>
                  <CardDescription>
                    {filterType !== "all" || filterRead !== "all"
                      ? "Aucune notification ne correspond à vos filtres."
                      : "Vous serez notifié lorsque de nouveaux événements se produiront."}
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper avec ProtectedRoute
const NotificationsPage = () => (
  <ProtectedRoute>
    <Notifications />
  </ProtectedRoute>
);

export default NotificationsPage;
