import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({ 
  message, 
  onRetry,
  className = "" 
}: ErrorStateProps) => {
  return (
    <Card className={`border-destructive ${className}`}>
      <CardContent className="py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium mb-2">Erreur</p>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Réessayer
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

