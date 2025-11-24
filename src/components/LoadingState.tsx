import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  skeleton?: boolean;
  className?: string;
}

export const LoadingState = ({ 
  message = "Chargement...", 
  skeleton = false,
  className = "" 
}: LoadingStateProps) => {
  if (skeleton) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
};

