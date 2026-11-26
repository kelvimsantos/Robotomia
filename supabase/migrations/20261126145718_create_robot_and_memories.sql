/*
# Robotomia: tabelas do robô (single-tenant, sem login)

1. New Tables
- `robot`
  - `id` (integer, primary key, sempre 1 — um único robô)
  - `name` (text, nome do robô)
  - `energy` (integer 0-100, energia)
  - `mood` (integer 0-100, humor)
  - `knowledge` (integer 0-100, conhecimento)
  - `autonomy` (integer 0-100, autonomia)
  - `aspiration` (text, aspiração atual)
  - `created_at`, `updated_at` (timestamps)
- `memories`
  - `id` (uuid, primary key)
  - `content` (text, o que aconteceu / o que foi dito)
  - `speaker` (text: 'user', 'robot' ou 'system')
  - `mood_delta` (integer, variação de humor causada pela memória)
  - `knowledge_delta` (integer, variação de conhecimento)
  - `created_at` (timestamp)
2. Security
- RLS habilitado nas duas tabelas.
- Policies liberadas para anon + authenticated (app sem login, dados intencionais compartilhados).
- Grants de CRUD para anon + authenticated.
3. Notes
- A linha inicial do robô é criada automaticamente via trigger ao inserir em `robot` (INSERT com id=1) — feita na própria migration com ON CONFLICT para ser idempotente.
*/

CREATE TABLE IF NOT EXISTS robot (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'Robotomia',
  energy integer NOT NULL DEFAULT 80 CHECK (energy BETWEEN 0 AND 100),
  mood integer NOT NULL DEFAULT 70 CHECK (mood BETWEEN 0 AND 100),
  knowledge integer NOT NULL DEFAULT 10 CHECK (knowledge BETWEEN 0 AND 100),
  autonomy integer NOT NULL DEFAULT 5 CHECK (autonomy BETWEEN 0 AND 100),
  aspiration text NOT NULL DEFAULT 'Aprender a conversar com humanos',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  speaker text NOT NULL DEFAULT 'user' CHECK (speaker IN ('user', 'robot', 'system')),
  mood_delta integer NOT NULL DEFAULT 0,
  knowledge_delta integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE robot ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON robot TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON memories TO anon, authenticated;

DROP POLICY IF EXISTS "robot_select" ON robot;
CREATE POLICY "robot_select" ON robot FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "robot_insert" ON robot;
CREATE POLICY "robot_insert" ON robot FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "robot_update" ON robot;
CREATE POLICY "robot_update" ON robot FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "robot_delete" ON robot;
CREATE POLICY "robot_delete" ON robot FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "memories_select" ON memories;
CREATE POLICY "memories_select" ON memories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "memories_insert" ON memories;
CREATE POLICY "memories_insert" ON memories FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "memories_delete" ON memories;
CREATE POLICY "memories_delete" ON memories FOR DELETE
TO anon, authenticated USING (true);

INSERT INTO robot (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
