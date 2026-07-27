import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { SiloLogo } from "@/components/SiloLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-8 bg-background px-4">
      <SiloLogo size="lg" />
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">Page introuvable</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <Link href="/" className="inline-block mt-4 text-sm font-medium text-primary hover:underline">
            Retour à l'accueil
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
