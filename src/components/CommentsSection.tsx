import { useState } from "react";
import { useComments } from "@/hooks/use-comments";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Edit2, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { useConfirm } from "@/hooks/use-confirm";

interface CommentsSectionProps {
  entryId: string;
  entryName?: string;
}

export const CommentsSection = ({ entryId, entryName }: CommentsSectionProps) => {
  const { user, profile } = useAuth();
  const { comments, isLoading, error, addComment, updateComment, deleteComment, isAdding, canEdit } = useComments(entryId);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const confirm = useConfirm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isAdding) return;
    addComment(newComment);
    setNewComment("");
  };

  const handleStartEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editingContent.trim()) return;
    updateComment({ commentId, content: editingContent });
    setEditingId(null);
    setEditingContent("");
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = await confirm({
      title: "Supprimer le commentaire",
      description: "Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.",
    });
    if (confirmed) {
      deleteComment(commentId);
    }
  };

  if (isLoading) {
    return <LoadingState message="Chargement des commentaires..." />;
  }

  if (error) {
    return <ErrorState message="Erreur lors du chargement des commentaires" />;
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire d'ajout */}
        {user && profile ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder={`Ajouter un commentaire sur ${entryName || "cette entrée"}...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newComment.trim() || isAdding} size="sm">
                <Send className="mr-2 h-4 w-4" />
                {isAdding ? "Publication..." : "Publier"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            <a href="/login" className="text-accent hover:underline">
              Connectez-vous
            </a>{" "}
            pour ajouter un commentaire.
          </p>
        )}

        {/* Liste des commentaires */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => {
              const isEditing = editingId === comment.id;
              const userDisplayName = (comment.user as any)?.display_name || "Utilisateur";
              const userAvatar = (comment.user as any)?.avatar_url;

              return (
                <div key={comment.id} className="flex gap-3 pb-4 border-b last:border-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userAvatar} alt={userDisplayName} />
                    <AvatarFallback>{userDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{userDisplayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                          {comment.updated_at !== comment.created_at && " (modifié)"}
                        </p>
                      </div>
                      {canEdit(comment) && !isEditing && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(comment)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editingContent.trim()}
                          >
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

