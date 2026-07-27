-- ============================================================
-- 3C STUDIO — Schéma initial Supabase
-- Migration 001 — Structure complète
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- TYPES ENUM
-- ============================================================

CREATE TYPE user_role AS ENUM ('client', 'agency', 'project_manager', 'admin');
CREATE TYPE project_status AS ENUM (
  'lead', 'qualification', 'devis', 'validation', 'production',
  'livraison_agence', 'verification', 'livraison_client',
  'correction', 'validation_finale', 'notation', 'archive'
);
CREATE TYPE project_type AS ENUM ('mariage', 'clip', 'corporate', 'reseaux', 'evenement', 'pub');
CREATE TYPE mission_status AS ENUM ('disponible', 'en_cours', 'rendu', 'valide', 'archive');
CREATE TYPE quote_status AS ENUM ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');
CREATE TYPE invoice_status AS ENUM ('brouillon', 'envoye', 'paye', 'en_retard', 'annule');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE file_type AS ENUM ('video', 'photo', 'audio', 'document', 'contract', 'invoice');
CREATE TYPE notification_type AS ENUM (
  'project_created', 'project_updated', 'status_changed',
  'message_received', 'file_uploaded', 'quote_sent',
  'quote_accepted', 'invoice_sent', 'payment_received',
  'delivery_ready', 'correction_requested', 'mention'
);
CREATE TYPE signature_status AS ENUM ('pending', 'sent', 'signed', 'refused', 'expired');

-- ============================================================
-- USERS & PROFILES
-- ============================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'client',
  phone TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  siret TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  country TEXT DEFAULT 'FR',
  website TEXT,
  logo_url TEXT,
  billing_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGENCIES
-- ============================================================

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  specialties project_type[],
  bio TEXT,
  portfolio_url TEXT,
  status TEXT DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'suspendu')),
  rating DECIMAL(3,2) DEFAULT 0,
  missions_count INTEGER DEFAULT 0,
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type project_type NOT NULL,
  status project_status NOT NULL DEFAULT 'lead',
  priority TEXT DEFAULT 'normale' CHECK (priority IN ('haute', 'normale', 'basse')),
  budget DECIMAL(10,2),
  start_date DATE,
  delivery_date DATE,
  shooting_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tags TEXT[],
  brief JSONB,
  client_id UUID REFERENCES user_profiles(id),
  pm_id UUID REFERENCES user_profiles(id),
  agency_id UUID REFERENCES agencies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, user_profile_id)
);

-- ============================================================
-- MISSIONS
-- ============================================================

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id),
  title TEXT NOT NULL,
  brief TEXT,
  status mission_status DEFAULT 'disponible',
  budget DECIMAL(10,2),
  deadline DATE,
  deliverables TEXT[],
  priority TEXT DEFAULT 'normale',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'project' CHECK (type IN ('project', 'support', 'direct')),
  title TEXT,
  -- Règle métier: client ↔ 3C Studio uniquement, agence ↔ chef de projet uniquement
  participant_ids UUID[],
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'file', 'system', 'correction_request')),
  metadata JSONB,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  read_by UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FILES & STORAGE
-- ============================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  type file_type NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  duration_seconds INTEGER,
  storage_path TEXT NOT NULL,  -- Supabase Storage path
  storage_bucket TEXT NOT NULL,
  public_url TEXT,
  is_deliverable BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_traitement', 'pret', 'valide', 'rejete')),
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS (WORKFLOW)
-- ============================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  assignee_id UUID REFERENCES user_profiles(id),
  due_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUOTES & INVOICES
-- ============================================================

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES user_profiles(id),
  status quote_status DEFAULT 'brouillon',
  amount_ht DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  amount_ttc DECIMAL(10,2) GENERATED ALWAYS AS (amount_ht * (1 + vat_rate / 100)) STORED,
  valid_until DATE,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id),
  quote_id UUID REFERENCES quotes(id),
  client_id UUID REFERENCES user_profiles(id),
  status invoice_status DEFAULT 'brouillon',
  amount_ht DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  amount_ttc DECIMAL(10,2) GENERATED ALWAYS AS (amount_ht * (1 + vat_rate / 100)) STORED,
  due_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  stripe_payment_intent_id TEXT,
  pdf_path TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES user_profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  project_id UUID REFERENCES projects(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS & RATINGS
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES user_profiles(id),
  subject_id UUID REFERENCES user_profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  aspects JSONB,  -- { quality: 5, communication: 4, timing: 5 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SIGNATURES
-- ============================================================

CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'contract', 'delivery_receipt')),
  document_id UUID NOT NULL,
  signer_email TEXT NOT NULL,
  signer_name TEXT,
  status signature_status DEFAULT 'pending',
  provider TEXT DEFAULT 'opensign',
  provider_document_id TEXT,
  provider_request_id TEXT,
  signed_at TIMESTAMPTZ,
  signed_document_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIDEO ROOMS (LiveKit)
-- ============================================================

CREATE TABLE video_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  room_name TEXT UNIQUE NOT NULL,
  title TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  participants JSONB DEFAULT '[]',
  recording_url TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COLLABORATIVE DOCUMENTS (Liveblocks)
-- ============================================================

CREATE TABLE collaborative_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'brief' CHECK (type IN ('brief', 'notes', 'script', 'storyboard')),
  liveblocks_room_id TEXT UNIQUE,
  content JSONB,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_user_profiles_clerk_user_id ON user_profiles(clerk_user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politique: Chaque user voit son propre profil
CREATE POLICY "Users see own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = clerk_user_id);

-- Politique: Admin voit tout
CREATE POLICY "Admins see all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE clerk_user_id = auth.uid()::text AND role = 'admin')
  );

-- Politique: Clients voient leurs projets
CREATE POLICY "Clients see own projects" ON projects
  FOR SELECT USING (
    client_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.uid()::text)
  );

-- Politique: PM voient les projets qu'ils gèrent
CREATE POLICY "PMs see managed projects" ON projects
  FOR SELECT USING (
    pm_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.uid()::text)
  );

-- Politique: Users voient leurs notifications
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM user_profiles WHERE clerk_user_id = auth.uid()::text)
  );

-- ============================================================
-- REALTIME
-- ============================================================

-- Activer Realtime pour ces tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
