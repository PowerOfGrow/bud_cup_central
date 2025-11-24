import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const Notifications = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotifications();

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
                    {notifications.length} notification{notifications.length > 1 ? "s" : ""}
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

            {/* Notifications non lues */}
            {unreadNotifications.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Non lues ({unreadNotifications.length})
                </h2>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`border-l-4 border-l-accent cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.read ? "bg-accent/5" : ""
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{notification.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {notification.message}
                            </CardDescription>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="bg-accent">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications lues */}
            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Lues ({readNotifications.length})
                </h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors opacity-75"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {notification.message}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          {notification.link && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={notification.link}>Voir →</Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Aucune notification */}
            {notifications.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <CardTitle className="mb-2">Aucune notification</CardTitle>
                  <CardDescription>
                    Vous serez notifié lorsque de nouveaux événements se produiront.
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

