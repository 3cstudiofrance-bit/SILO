import { useState, useRef, useCallback } from "react";
import { Upload, X, File, Video, Image, Music, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFile, formatFileSize } from "@/services/fileService";
import { STORAGE_BUCKETS } from "@/types";
import type { StorageBucket } from "@/types";

interface FileItem {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
}

function getFileIcon(mime: string) {
  if (mime.startsWith("video/")) return <Video className="w-4 h-4 text-violet-400" />;
  if (mime.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  if (mime.startsWith("audio/")) return <Music className="w-4 h-4 text-pink-400" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
}

interface FileUploaderProps {
  projectId: string;
  bucket?: StorageBucket;
  accept?: string;
  maxSizeMb?: number;
  onUploadComplete?: (
    url: string,
    path: string,
    file: File,
  ) => Promise<void> | void;
  className?: string;
}

export function FileUploader({
  projectId,
  bucket = STORAGE_BUCKETS.PROJECT_FILES,
  accept = "*",
  maxSizeMb = 2048,
  onUploadComplete,
  className,
}: FileUploaderProps) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: File[]) => {
    const maxBytes = maxSizeMb * 1024 * 1024;
    const valid = files.filter(f => {
      if (f.size > maxBytes) {
        console.warn(`[FileUploader] Fichier trop volumineux: ${f.name}`);
        return false;
      }
      return true;
    });

    const newItems: FileItem[] = valid.map(f => ({
      id: `${Date.now()}-${f.name}`,
      file: f,
      status: "queued",
      progress: 0,
    }));

    setItems(prev => [...prev, ...newItems]);

    // Upload each file
    for (const item of newItems) {
      uploadSingle(item);
    }
  }, [projectId, bucket, onUploadComplete]);

  async function uploadSingle(item: FileItem) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "uploading", progress: 10 } : i));

    const result = await uploadFile({
      bucket,
      projectId,
      file: item.file,
      onProgress: (pct) => {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: pct } : i));
      },
    });

    if (result.error) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "error", error: result.error! } : i));
    } else {
      try {
        await onUploadComplete?.(
          result.publicUrl ?? "",
          result.path,
          item.file,
        );
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "done", progress: 100, url: result.publicUrl ?? undefined } : i));
      } catch (error) {
        setItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Métadonnées non enregistrées",
        } : i));
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const allDone = items.length > 0 && items.every(i => i.status === "done" || i.status === "error");
  const isUploading = items.some(i => i.status === "uploading");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-card/50"
        )}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          isDragging ? "bg-primary/20" : "bg-card border border-border"
        )}>
          <Upload className={cn("w-5 h-5 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Déposer des fichiers ici</p>
          <p className="text-xs text-muted-foreground mt-0.5">ou cliquer pour parcourir · Max {maxSizeMb >= 1024 ? `${maxSizeMb / 1024} Go` : `${maxSizeMb} Mo`} par fichier</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={e => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {/* File list */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border">
              <div className="shrink-0">{getFileIcon(item.file.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</p>
                  {item.status === "uploading" && (
                    <>
                      <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.progress}%</p>
                    </>
                  )}
                  {item.status === "done" && <p className="text-[10px] text-emerald-400">Uploadé</p>}
                  {item.status === "error" && <p className="text-[10px] text-red-400">Erreur: {item.error}</p>}
                </div>
              </div>
              <div className="shrink-0">
                {item.status === "uploading" && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                {item.status === "done" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {item.status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                {item.status === "queued" && (
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {allDone && items.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {items.filter(i => i.status === "done").length}/{items.length} fichier{items.length > 1 ? "s" : ""} uploadé{items.filter(i => i.status === "done").length > 1 ? "s" : ""}
          </p>
          <button onClick={() => setItems([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Effacer la liste
          </button>
        </div>
      )}
    </div>
  );
}
