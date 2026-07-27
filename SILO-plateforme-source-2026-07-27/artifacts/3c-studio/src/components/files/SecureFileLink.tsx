import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { resolveStoredFileUrl } from "@/services/fileService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SecureFileLinkProps {
  reference: string;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function SecureFileLink({
  reference,
  children,
  className,
  title,
}: SecureFileLinkProps) {
  const [isOpening, setIsOpening] = useState(false);
  const { toast } = useToast();

  const open = async () => {
    if (isOpening) return;
    setIsOpening(true);
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;

    try {
      const url = await resolveStoredFileUrl(reference);
      if (!url) throw new Error("URL signée indisponible");
      if (popup) popup.location.replace(url);
      else window.location.assign(url);
    } catch {
      popup?.close();
      toast({
        title: "Fichier inaccessible",
        description:
          "Le lien temporaire n’a pas pu être créé. Vérifiez votre session.",
        variant: "destructive",
      });
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void open()}
      disabled={isOpening}
      className={cn(className, "disabled:opacity-50")}
      title={title}
    >
      {isOpening && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}
