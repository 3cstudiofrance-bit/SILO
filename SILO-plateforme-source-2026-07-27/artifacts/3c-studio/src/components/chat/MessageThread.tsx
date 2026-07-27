import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send } from "lucide-react";
import {
  getListFeedEntriesQueryKey,
  useCreateFeedEntry,
  useListFeedEntries,
  type FeedEntry,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

type MessageChannel = "client_pm" | "pm_agency" | "client_agency";

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (value.toDateString() === today.toDateString()) return "Aujourd’hui";
  if (value.toDateString() === yesterday.toDateString()) return "Hier";
  return value.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function MessageBubble({
  message,
  isMine,
  showAvatar,
}: {
  message: FeedEntry;
  isMine: boolean;
  showAvatar: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5",
        isMine ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
          showAvatar
            ? isMine
              ? "bg-primary/20 text-primary"
              : "border border-border bg-card text-muted-foreground"
            : "opacity-0",
        )}
      >
        {initials(message.authorName)}
      </div>
      <div
        className={cn(
          "flex max-w-[75%] flex-col",
          isMine ? "items-end" : "items-start",
        )}
      >
        {showAvatar && !isMine && (
          <p className="mb-1 px-1 text-xs text-muted-foreground">
            {message.authorName}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isMine
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card text-foreground",
          )}
        >
          {message.content}
        </div>
        <time className="mt-1 px-1 text-[10px] text-muted-foreground/50">
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

interface MessageThreadProps {
  projectId: number | null;
  channel: MessageChannel;
  partnerUserId?: string | null;
  placeholder?: string;
  className?: string;
}

export function MessageThread({
  projectId,
  channel,
  partnerUserId,
  placeholder,
  className,
}: MessageThreadProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const projectKey = String(projectId ?? 0);
  const { data: entries = [], isLoading, isError } = useListFeedEntries(
    projectKey,
    {
      query: {
        enabled: projectId !== null,
        queryKey: getListFeedEntriesQueryKey(projectKey),
        refetchInterval: 3_000,
      },
    },
  );
  const createEntry = useCreateFeedEntry();
  const messages = useMemo(
    () =>
      entries.filter(
        (entry) =>
          entry.type === "message" &&
          entry.channel === channel &&
          (!partnerUserId ||
            entry.counterpartyUserId === partnerUserId),
      ),
    [channel, entries, partnerUserId],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const content = input.trim();
    if (!content || !projectId || createEntry.isPending) return;

    createEntry.mutate(
      {
        projectId: String(projectId),
        data: {
          mode: "message",
          channel,
          partnerUserId,
          content,
        },
      },
      {
        onSuccess: () => {
          setInput("");
          void queryClient.invalidateQueries({
            queryKey: getListFeedEntriesQueryKey(String(projectId)),
          });
        },
      },
    );
  };

  const grouped: { date: string; messages: FeedEntry[] }[] = [];
  for (const message of messages) {
    const date = formatDate(message.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.date === date) last.messages.push(message);
    else grouped.push({ date, messages: [message] });
  }

  if (!projectId) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className,
        )}
      >
        <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Sélectionnez un projet pour voir les messages
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-red-400">
            Les messages n’ont pas pu être chargés.
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-2 h-7 w-7 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Aucun message pour l’instant
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Commencez la conversation ci-dessous
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="whitespace-nowrap text-xs text-muted-foreground/60">
                  {group.date}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-1">
                {group.messages.map((message, index) => {
                  const previous = group.messages[index - 1];
                  const isMine = message.authorUserId === user?.id;
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMine={isMine}
                      showAvatar={
                        !previous ||
                        previous.authorUserId !== message.authorUserId
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        {createEntry.isError && (
          <p className="mb-2 text-xs text-red-400">
            Le message n’a pas pu être envoyé.
          </p>
        )}
        <div className="flex items-end gap-2 border border-border bg-card px-3 py-2 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/30">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder={placeholder ?? "Écrire un message…"}
            rows={1}
            className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || createEntry.isPending}
            className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center bg-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createEntry.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" />
            ) : (
              <Send className="h-3.5 w-3.5 text-primary-foreground" />
            )}
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground/40">
          Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}
