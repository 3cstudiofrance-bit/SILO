---
name: Clerk auth + Supabase RLS mismatch
description: Why Supabase realtime/reads get blocked when the app authenticates with Clerk, and the clean fix.
---

# Clerk auth + Supabase RLS mismatch

This app authenticates users with **Clerk**, not Supabase Auth. The browser talks to
Supabase directly (realtime chat, reads) using the **anon key**.

**Problem:** Supabase RLS policies that reference `auth.uid()` evaluate to NULL under
Clerk, because no Supabase JWT is present. Tables with RLS enabled but no anon-permissive
policy (e.g. `messages`, `conversations`) will therefore **deny all anon-key
reads/inserts and block realtime delivery** — even though the client code is correct.

**Why:** Realtime authorization and PostgREST both enforce RLS; with a null `auth.uid()`
and no matching policy, everything is denied.

**How to apply / clean fix (recommended):**
1. Create a Clerk JWT template for Supabase; pass the token to the Supabase client via the
   access-token callback so requests carry a Supabase-compatible JWT.
2. Write RLS policies keyed to JWT claims (map Clerk `sub` → `user_profiles.clerk_user_id`)
   and to conversation **participant membership** — NOT broad anon access.
3. Validate with two real users: send/receive, typing indicator, mark-as-read under RLS.

**Do NOT** "fix" this by adding permissive public anon policies — that exposes chat data
cross-tenant (serious security hole; the anon key ships to every browser).

**Migrations:** `supabase/migrations/` holds the schema. 001 = initial, 002 = messaging
RPC (`mark_messages_read`) + `last_message_at` trigger + realtime for `conversations`.
003 = participant RLS + `current_profile_id()` (uses `auth.jwt()->>'sub'`). 004 =
`get_or_join_conversation` RPC. Migrations must be applied manually in the Supabase SQL
editor (agent only has the anon key, cannot run DDL) — 004 is the newest and easy to miss.

**Keyed-conversation convergence (the RLS discovery problem):** two accounts can never
"find" the same conversation via client SELECT because RLS hides rows you're not yet a
participant of. Fix = a stable KEY stored in `conversations.title` + a SECURITY DEFINER
RPC (`get_or_join_conversation(key, type)`) that finds-or-creates by key and adds the
caller to `participant_ids`. UI keys must be identical on both sides: client↔PM use
`project:<id>:client-pm`; PM↔agency slugify the project NAME identically
(`.toLowerCase().replace(/[^a-z0-9]+/g,'-')`).

**Security rule for that RPC:** a naive "append caller to participant_ids" is an IDOR —
anyone who guesses the key self-enrolls and passes RLS. Because these channels are 1:1,
harden with (a) a UNIQUE index on `(type, title)` + `ON CONFLICT` for race-safe
find-or-create, and (b) a participant CAP (2) that REJECTS a third joiner. If real
group/keyed channels ever exist, derive membership from trusted project/role tables
instead of a blind cap.

**Data-side identity:** always use the Supabase profile UUID (`profile.id` via
ProfileContext), never the Clerk id, for `senderId`/typing/`isMine`/read receipts. Clerk
id is only a mock-mode fallback.
