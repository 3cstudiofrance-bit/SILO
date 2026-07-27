/**
 * fileService — Upload, download, preview via Supabase Storage
 */
import * as tus from "tus-js-client";
import {
  getSupabaseAccessToken,
  isSupabaseConfigured,
  supabase,
  supabaseProjectUrl,
  supabasePublishableKey,
} from "./supabaseClient";
import type { StorageBucket } from "@/types";
import { STORAGE_BUCKETS } from "@/types";

export interface UploadOptions {
  bucket: StorageBucket;
  projectId: string;
  file: File;
  onProgress?: (percent: number) => void;
}

export interface UploadResult {
  path: string;
  publicUrl: string | null;
  error: string | null;
}

const RESUMABLE_UPLOAD_THRESHOLD = 6 * 1024 * 1024;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
const STORAGE_REFERENCE_PREFIX = "storage://";

function resumableEndpoint(projectUrl: string): string {
  const parsed = new URL(projectUrl);
  const hostParts = parsed.hostname.split(".");
  if (hostParts.length >= 3 && parsed.hostname.endsWith(".supabase.co")) {
    return `${parsed.protocol}//${hostParts[0]}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${projectUrl.replace(/\/+$/, "")}/storage/v1/upload/resumable`;
}

async function uploadResumable(
  bucket: StorageBucket,
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const projectUrl = supabaseProjectUrl;
  if (!projectUrl) {
    throw new Error("URL Supabase absente");
  }
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Session Clerk indisponible pour l’upload");
  }

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: resumableEndpoint(projectUrl),
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(supabasePublishableKey ? { apikey: supabasePublishableKey } : {}),
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError: (error) => reject(error),
      onProgress: (uploaded, total) => {
        onProgress?.(Math.round((uploaded / total) * 100));
      },
      onSuccess: () => resolve(),
    });

    void upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads[0]) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    }, reject);
  });
}

/**
 * Upload un fichier vers Supabase Storage et enregistre les métadonnées en DB.
 */
export async function uploadFile(
  options: UploadOptions,
): Promise<UploadResult> {
  const { bucket, projectId, file } = options;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${projectId}/${Date.now()}-${safeName}`;

  if (!isSupabaseConfigured || !supabase) {
    return {
      path: "",
      publicUrl: null,
      error: "Stockage Supabase non configuré",
    };
  }

  if (file.size > RESUMABLE_UPLOAD_THRESHOLD) {
    try {
      await uploadResumable(bucket, path, file, options.onProgress);
    } catch (error) {
      return {
        path: "",
        publicUrl: null,
        error:
          error instanceof Error
            ? error.message
            : "Échec de l’upload reprenable",
      };
    }
  } else {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) return { path: "", publicUrl: null, error: error.message };
    options.onProgress?.(100);
  }

  return { path, publicUrl: storageReference(bucket, path), error: null };
}

/**
 * Génère une URL signée (accès temporaire, pour fichiers privés).
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  return error ? null : data.signedUrl;
}

export function storageReference(bucket: StorageBucket, path: string): string {
  return `${STORAGE_REFERENCE_PREFIX}${bucket}/${path}`;
}

export async function resolveStoredFileUrl(
  reference: string,
): Promise<string | null> {
  if (!reference.startsWith(STORAGE_REFERENCE_PREFIX)) {
    try {
      const url = new URL(reference);
      return url.protocol === "https:" || url.protocol === "http:"
        ? url.toString()
        : null;
    } catch {
      return null;
    }
  }

  const value = reference.slice(STORAGE_REFERENCE_PREFIX.length);
  const separator = value.indexOf("/");
  if (separator <= 0) return null;
  const bucket = value.slice(0, separator);
  const path = value.slice(separator + 1);
  if (
    !path ||
    !Object.values(STORAGE_BUCKETS).includes(bucket as StorageBucket)
  ) {
    return null;
  }
  return getSignedUrl(bucket as StorageBucket, path);
}

// ---- UTILS ----

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} Go`;
}
