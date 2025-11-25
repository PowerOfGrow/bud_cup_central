import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Shield,
  AlertTriangle,
  Ban,
  Unlock,
  Trash2,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Eye,
  Award,
  Scale,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAdminUsers, useSanctionsHistory, useBanUser, useUnbanUser, useDeleteUserAccount, useAdminKPIs, type AdminUserStats, type SanctionHistory } from "@/hooks/use-admin";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationControls } from "@/components/PaginationControls";

const Admin = () => {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserStats | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banReasonDetails, setBanReasonDetails] = useState("");
  const [banType, setBanType] = useState<"warning" | "temporary_ban" | "permanent_ban">("temporary_ban");
  const [banExpiresAt, setBanExpiresAt] = useState("");
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  // Récupérer les utilisateurs
  const { data: users, isLoading: usersLoading } = useAdminUsers(roleFilter);
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs();
  const { data: sanctionsHistory } = useSanctionsHistory(viewingHistory);

  const banUserMutation = useBanUser();
  const unbanUserMutation = useUnbanUser();
  const deleteUserMutation = useDeleteUserAccount();

  // Filtrer et rechercher les utilisateurs
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, searchQuery]);

  // Pagination
  const itemsPerPage = 20;
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
  } = usePagination(filteredUsers, itemsPerPage);

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) {
      toast.error("Veuillez remplir la raison du bannissement");
      return;
    }

    await banUserMutation.mutateAsync({
      userId: selectedUser.id,
      sanctionType: banType,
      reason: banReason,
      reasonDetails: banReasonDetails || undefined,
      expiresAt: banType === "temporary_ban" && banExpiresAt ? banExpiresAt : undefined,
    });

    setBanDialogOpen(false);
    setSelectedUser(null);
    setBanReason("");
    setBanReasonDetails("");
    setBanExpiresAt("");
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    await unbanUserMutation.mutateAsync(selectedUser.id);
    setUnbanDialogOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !banReason) {
      toast.error("Veuillez remplir la raison de la suppression");
      return;
    }

    await deleteUserMutation.mutateAsync({
      userId: selectedUser.id,
      reason: banReason,
      reasonDetails: banReasonDetails || undefined,
    });

    setDeleteDialogOpen(false);
    setSelectedUser(null);
    setBanReason("");
    setBanReasonDetails("");
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "organizer":
        return "default";
      case "producer":
        return "secondary";
      case "judge":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "organizer":
        return Shield;
      case "producer":
        return FileText;
      case "judge":
        return Scale;
      default:
        return Users;
    }
  };

  if (usersLoading || kpisLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <LoadingState message="Chargement des données admin..." />
        </div>
      </div>
    );
  }

  if (!users || !kpis) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-16">
          <ErrorState message="Erreur lors du chargement des données" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🔐 Administration
            </h1>
            <p className="text-muted-foreground">
              Gestion complète de la plateforme, modération des utilisateurs et analytics détaillées
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="mr-2 h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="mr-2 h-4 w-4" />
                Utilisateurs ({filteredUsers.length})
              </TabsTrigger>
              <TabsTrigger value="sanctions">
                <Shield className="mr-2 h-4 w-4" />
                Sanctions ({sanctionsHistory?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Vue d'ensemble avec KPIs */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Utilisateurs Actifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpis.global.active_producers_count || 0} producteurs
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.global.active_voters_count || 0} votants • {kpis.global.active_judges_count || 0} juges
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Entrées Approuvées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpis.global.approved_entries_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.global.entries_last_30d || 0} dernières 30j
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Votes Totaux
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpis.global.total_votes_count || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {kpis.global.votes_last_30d || 0} dernières 30j
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Taux d'Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpis.global.engagement_rate_percent?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complétion: {kpis.global.completion_rate_percent?.toFixed(1) || 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Statistiques par rôle */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Producteurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-semibold">
                          {users.filter((u) => u.role === "producer").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Actifs (30j)</span>
                        <span className="font-semibold">
                          {kpis.global.active_producers_last_30d || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bannis</span>
                        <span className="font-semibold text-destructive">
                          {users.filter((u) => u.role === "producer" && u.is_banned).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Membres Gratuits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-semibold">
                          {users.filter((u) => u.role === "viewer").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Votants actifs</span>
                        <span className="font-semibold">
                          {kpis.global.active_voters_count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bannis</span>
                        <span className="font-semibold text-destructive">
                          {users.filter((u) => u.role === "viewer" && u.is_banned).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Juges & Organisateurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Juges</span>
                        <span className="font-semibold">
                          {users.filter((u) => u.role === "judge").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Organisateurs</span>
                        <span className="font-semibold">
                          {users.filter((u) => u.role === "organizer").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bannis</span>
                        <span className="font-semibold text-destructive">
                          {users.filter((u) => (u.role === "judge" || u.role === "organizer") && u.is_banned).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gestion des utilisateurs */}
            <TabsContent value="users" className="space-y-6">
              {/* Filtres et recherche */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par nom ou email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filtrer par rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        <SelectItem value="organizer">Organisateurs</SelectItem>
                        <SelectItem value="producer">Producteurs</SelectItem>
                        <SelectItem value="judge">Juges</SelectItem>
                        <SelectItem value="viewer">Membres gratuits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des utilisateurs */}
              <div className="space-y-4">
                {paginatedItems.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 rounded-lg bg-muted">
                              <RoleIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{user.display_name}</h3>
                                {user.is_banned && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Ban className="h-3 w-3 mr-1" />
                                    Banni
                                  </Badge>
                                )}
                                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs capitalize">
                                  {user.role}
                                </Badge>
                                {user.is_verified && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Vérifié
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                              <div className="flex flex-wrap gap-4 text-sm">
                                {user.role === "producer" && user.entries_count !== null && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.entries_count} entrée(s)</span>
                                  </div>
                                )}
                                {user.role === "judge" && user.evaluations_count !== null && (
                                  <div className="flex items-center gap-1">
                                    <Scale className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.evaluations_count} évaluation(s)</span>
                                  </div>
                                )}
                                {user.role === "viewer" && user.votes_count !== null && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.votes_count} vote(s)</span>
                                  </div>
                                )}
                                {user.role === "organizer" && user.contests_created_count !== null && (
                                  <div className="flex items-center gap-1">
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                    <span>{user.contests_created_count} concours</span>
                                  </div>
                                )}
                                {user.sanctions_count > 0 && (
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>{user.sanctions_count} sanction(s)</span>
                                  </div>
                                )}
                                {user.last_activity_at && (
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      Actif: {format(new Date(user.last_activity_at), "dd MMM yyyy", { locale: fr })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {user.sanctions_count > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingHistory(user.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Historique
                              </Button>
                            )}
                            {user.is_banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setUnbanDialogOpen(true);
                                }}
                              >
                                <Unlock className="mr-2 h-4 w-4" />
                                Dé-bannir
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setBanDialogOpen(true);
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Bannir
                              </Button>
                            )}
                            {user.role !== "organizer" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onNext={nextPage}
                  onPrevious={previousPage}
                />
              )}
            </TabsContent>

            {/* Historique des sanctions */}
            <TabsContent value="sanctions" className="space-y-4">
              {sanctionsHistory && sanctionsHistory.length > 0 ? (
                sanctionsHistory.map((sanction) => (
                  <Card key={sanction.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{sanction.user_name}</h3>
                            <Badge variant="destructive" className="text-xs capitalize">
                              {sanction.sanction_type.replace("_", " ")}
                            </Badge>
                            {sanction.is_active && (
                              <Badge variant="outline" className="text-xs">Actif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{sanction.reason}</p>
                          {sanction.reason_details && (
                            <p className="text-sm text-muted-foreground mb-2">{sanction.reason_details}</p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>
                              Par: {sanction.sanctioned_by_name}
                            </span>
                            <span>
                              Le: {format(new Date(sanction.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                            </span>
                            {sanction.expires_at && (
                              <span>
                                Expire: {format(new Date(sanction.expires_at), "dd MMM yyyy", { locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Aucune sanction enregistrée
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog Bannir */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bannir un utilisateur</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de bannir {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de sanction</Label>
              <Select value={banType} onValueChange={(v: any) => setBanType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="temporary_ban">Bannissement temporaire</SelectItem>
                  <SelectItem value="permanent_ban">Bannissement permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banType === "temporary_ban" && (
              <div>
                <Label>Date d'expiration</Label>
                <Input
                  type="datetime-local"
                  value={banExpiresAt}
                  onChange={(e) => setBanExpiresAt(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Raison *</Label>
              <Select
                value={banReason}
                onValueChange={setBanReason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mauvaise conduite">Mauvaise conduite</SelectItem>
                  <SelectItem value="Tricherie">Tricherie</SelectItem>
                  <SelectItem value="Spam">Spam</SelectItem>
                  <SelectItem value="Contenu inapproprié">Contenu inapproprié</SelectItem>
                  <SelectItem value="Violation des règles">Violation des règles</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Détails supplémentaires</Label>
              <Textarea
                value={banReasonDetails}
                onChange={(e) => setBanReasonDetails(e.target.value)}
                placeholder="Détails de la raison du bannissement..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={!banReason || banUserMutation.isPending}
            >
              {banUserMutation.isPending ? "Bannissement..." : "Bannir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Dé-bannir */}
      <AlertDialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dé-bannir un utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir dé-bannir {selectedUser?.display_name} ? Cette action révoquera toutes les sanctions actives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnbanUser}
              disabled={unbanUserMutation.isPending}
            >
              {unbanUserMutation.isPending ? "Dé-bannissement..." : "Dé-bannir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Supprimer */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement un compte</DialogTitle>
            <DialogDescription className="text-destructive">
              ⚠️ ATTENTION : Cette action est irréversible. Le compte de {selectedUser?.display_name} sera supprimé définitivement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Raison *</Label>
              <Select
                value={banReason}
                onValueChange={setBanReason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mauvaise conduite grave">Mauvaise conduite grave</SelectItem>
                  <SelectItem value="Tricherie avérée">Tricherie avérée</SelectItem>
                  <SelectItem value="Demande utilisateur">Demande utilisateur</SelectItem>
                  <SelectItem value="Violation grave des règles">Violation grave des règles</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Détails supplémentaires</Label>
              <Textarea
                value={banReasonDetails}
                onChange={(e) => setBanReasonDetails(e.target.value)}
                placeholder="Détails de la raison de la suppression..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={!banReason || deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Historique des sanctions */}
      {viewingHistory && (
        <Dialog open={!!viewingHistory} onOpenChange={() => setViewingHistory(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Historique des sanctions</DialogTitle>
              <DialogDescription>
                Historique complet pour {sanctionsHistory?.find((s) => s.user_id === viewingHistory)?.user_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {sanctionsHistory && sanctionsHistory.filter((s) => s.user_id === viewingHistory).map((sanction) => (
                <Card key={sanction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive" className="text-xs capitalize">
                        {sanction.sanction_type.replace("_", " ")}
                      </Badge>
                      {sanction.is_active && (
                        <Badge variant="outline" className="text-xs">Actif</Badge>
                      )}
                    </div>
                    <p className="font-semibold mb-1">{sanction.reason}</p>
                    {sanction.reason_details && (
                      <p className="text-sm text-muted-foreground mb-2">{sanction.reason_details}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p>Par: {sanction.sanctioned_by_name}</p>
                      <p>Le: {format(new Date(sanction.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
                      {sanction.expires_at && (
                        <p>Expire: {format(new Date(sanction.expires_at), "dd MMM yyyy", { locale: fr })}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const AdminPage = () => (
  <ProtectedRoute requiredRole="organizer">
    <Admin />
  </ProtectedRoute>
);

export default AdminPage;

