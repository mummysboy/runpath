-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'blocked', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_type AS ENUM ('bug', 'feature', 'improvement', 'question');
CREATE TYPE billing_type AS ENUM ('hourly', 'fixed', 'retainer', 'custom');
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'prospect');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE member_role AS ENUM ('admin', 'ux', 'dev', 'client');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE evidence_kind AS ENUM ('link', 'file');

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE users_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role permissions junction
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- User roles (scoped to org, client, or project)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('org', 'client', 'project')),
  scope_id UUID, -- references clients.id or projects.id, NULL for org scope
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id, scope_type, scope_id)
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  billing_type billing_type NOT NULL DEFAULT 'hourly',
  status client_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role member_role NOT NULL,
  client_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  type ticket_type NOT NULL DEFAULT 'bug',
  client_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket evidence (links or file references)
CREATE TABLE ticket_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  kind evidence_kind NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket comments
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket status history (audit trail)
CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  from_status ticket_status,
  to_status ticket_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approvals table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  requested_from UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billing profiles (placeholder for future billing module)
CREATE TABLE billing_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  billing_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales pipeline (placeholder for future sales/CRM module)
CREATE TABLE sales_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'prospecting',
  value DECIMAL(12, 2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing campaigns (placeholder for future marketing module)
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION current_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users_profile WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(permission_key TEXT, check_scope_type TEXT DEFAULT NULL, check_scope_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- Check if user has permission at any scope level
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.key = permission_key
      AND (
        -- Org-wide permission
        (check_scope_type IS NULL AND ur.scope_type = 'org' AND ur.scope_id IS NULL)
        OR
        -- Client-scoped permission
        (check_scope_type = 'client' AND ur.scope_type = 'client' AND ur.scope_id = check_scope_id)
        OR
        -- Project-scoped permission
        (check_scope_type = 'project' AND ur.scope_type = 'project' AND ur.scope_id = check_scope_id)
        OR
        -- Org-wide permission works everywhere
        (ur.scope_type = 'org' AND ur.scope_id IS NULL)
      )
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is project member
CREATE OR REPLACE FUNCTION is_project_member(check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM project_members
    WHERE project_id = check_project_id
      AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own org
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (id = current_org_id());

-- Users profile: Users can view profiles in their org
CREATE POLICY "Users can view profiles in own org"
  ON users_profile FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  USING (user_id = auth.uid());

-- Roles: Users can view roles in their org
CREATE POLICY "Users can view roles in own org"
  ON roles FOR SELECT
  USING (org_id = current_org_id());

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  USING (has_permission('admin.manage_roles'));

-- Permissions: Everyone can view (read-only table)
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- Role permissions: View only within org
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.org_id = current_org_id()
    )
  );

CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  USING (has_permission('admin.manage_roles'));

-- User roles: View own roles and org members
CREATE POLICY "Users can view user roles in own org"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile up
      WHERE up.user_id = user_roles.user_id
        AND up.org_id = current_org_id()
    )
  );

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (has_permission('admin.manage_roles'));

-- Clients: Users can view clients in their org
CREATE POLICY "Users can view clients in own org"
  ON clients FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (has_permission('admin.manage_clients'));

-- Projects: Users can view projects in their org
CREATE POLICY "Users can view projects in own org"
  ON projects FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Admins and project members can manage projects"
  ON projects FOR ALL
  USING (
    has_permission('admin.manage_projects')
    OR is_project_member(id)
  );

-- Project members: View if member or org member
-- NOTE: Only check org membership to avoid circular dependency
-- Users can see members of any project in their org
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE org_id = current_org_id()
    )
  );

CREATE POLICY "Admins can manage project members"
  ON project_members FOR ALL
  USING (has_permission('admin.manage_projects'));

-- Helper to get org_id from project
CREATE OR REPLACE FUNCTION get_project_org_id(project_uuid UUID)
RETURNS UUID AS $$
  SELECT org_id FROM projects WHERE id = project_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Tickets: Complex visibility rules
CREATE POLICY "Users can view tickets in own org"
  ON tickets FOR SELECT
  USING (
    org_id = current_org_id()
    AND (
      -- Internal users see all tickets
      NOT EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tickets.project_id
          AND pm.user_id = auth.uid()
          AND pm.member_role = 'client'
      )
      OR
      -- Clients only see client-visible tickets
      (client_visible = true AND EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tickets.project_id
          AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "UX can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    org_id = current_org_id()
    AND (
      has_permission('tickets.create')
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tickets.project_id
          AND pm.user_id = auth.uid()
          AND pm.member_role IN ('ux', 'admin')
      )
    )
  );

CREATE POLICY "Devs can update tickets"
  ON tickets FOR UPDATE
  USING (
    org_id = current_org_id()
    AND (
      has_permission('tickets.change_status')
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = tickets.project_id
          AND pm.user_id = auth.uid()
          AND pm.member_role IN ('dev', 'admin')
      )
    )
  );

-- Ticket evidence: Same visibility as tickets
CREATE POLICY "Users can view ticket evidence"
  ON ticket_evidence FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE org_id = current_org_id()
    )
  );

CREATE POLICY "Users can manage ticket evidence"
  ON ticket_evidence FOR ALL
  USING (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE org_id = current_org_id()
        AND created_by = auth.uid()
    )
  );

-- Ticket comments: Clients can't see internal comments
CREATE POLICY "Users can view ticket comments"
  ON ticket_comments FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE org_id = current_org_id()
    )
    AND (
      -- Internal users see all comments
      (is_internal = false OR has_permission('tickets.view_internal'))
      OR
      -- Clients only see non-internal comments
      (is_internal = false AND EXISTS (
        SELECT 1 FROM project_members pm
        JOIN tickets t ON pm.project_id = t.project_id
        WHERE t.id = ticket_comments.ticket_id
          AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Project members can comment"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE org_id = current_org_id()
    )
    AND EXISTS (
      SELECT 1 FROM project_members pm
      JOIN tickets t ON pm.project_id = t.project_id
      WHERE t.id = ticket_comments.ticket_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own comments"
  ON ticket_comments FOR UPDATE
  USING (author_id = auth.uid());

-- Ticket status history: Internal users only
CREATE POLICY "Internal users can view status history"
  ON ticket_status_history FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets WHERE org_id = current_org_id()
    )
    AND has_permission('tickets.view_internal')
  );

CREATE POLICY "System can create status history"
  ON ticket_status_history FOR INSERT
  WITH CHECK (changed_by = auth.uid());

-- Approvals: Project members can view
CREATE POLICY "Project members can view approvals"
  ON approvals FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create approvals"
  ON approvals FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Audit log: Admins only
CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  USING (has_permission('admin.view_audit_log'));

CREATE POLICY "System can create audit log"
  ON audit_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- Billing profiles: Admins and billing permissions
CREATE POLICY "Users with billing permission can view"
  ON billing_profiles FOR SELECT
  USING (
    org_id = current_org_id()
    AND has_permission('admin.manage_billing')
  );

CREATE POLICY "Admins can manage billing"
  ON billing_profiles FOR ALL
  USING (has_permission('admin.manage_billing'));

-- Sales opportunities: Users in org can view
CREATE POLICY "Users can view sales opportunities"
  ON sales_opportunities FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Admins can manage sales"
  ON sales_opportunities FOR ALL
  USING (has_permission('admin.manage_sales'));

-- Marketing campaigns: Users in org can view
CREATE POLICY "Users can view marketing campaigns"
  ON marketing_campaigns FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Admins can manage marketing"
  ON marketing_campaigns FOR ALL
  USING (has_permission('admin.manage_marketing'));

-- Seed default permissions
INSERT INTO permissions (key, description) VALUES
  ('tickets.create', 'Create new tickets'),
  ('tickets.comment', 'Add comments to tickets'),
  ('tickets.change_status', 'Change ticket status'),
  ('tickets.view_internal', 'View internal-only comments and fields'),
  ('admin.manage_roles', 'Manage roles and permissions'),
  ('admin.manage_users', 'Manage users and assignments'),
  ('admin.manage_clients', 'Manage clients'),
  ('admin.manage_projects', 'Manage projects'),
  ('admin.manage_billing', 'Manage billing and invoicing'),
  ('admin.manage_sales', 'Manage sales pipeline'),
  ('admin.manage_marketing', 'Manage marketing campaigns'),
  ('admin.view_audit_log', 'View audit log');

-- Create default organization (to be replaced with actual org creation)
INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Runpath Labs')
ON CONFLICT DO NOTHING;

-- Seed default roles (these will be associated with the default org)
-- Note: Role IDs should match what you use in your app, or use a lookup by name
DO $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000001';
  admin_role_id UUID;
  ux_role_id UUID;
  dev_role_id UUID;
  client_role_id UUID;
BEGIN
  -- Create Admin role
  INSERT INTO roles (id, org_id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000010', default_org_id, 'Admin', 'Full administrative access')
  ON CONFLICT DO NOTHING
  RETURNING id INTO admin_role_id;

  -- Create UX Researcher role
  INSERT INTO roles (id, org_id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000020', default_org_id, 'UX Researcher', 'Can create tickets and view project data')
  ON CONFLICT DO NOTHING
  RETURNING id INTO ux_role_id;

  -- Create Developer role
  INSERT INTO roles (id, org_id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000030', default_org_id, 'Developer', 'Can comment on tickets and change status')
  ON CONFLICT DO NOTHING
  RETURNING id INTO dev_role_id;

  -- Create Client role
  INSERT INTO roles (id, org_id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000040', default_org_id, 'Client', 'Can view project progress and comment on client-visible items')
  ON CONFLICT DO NOTHING
  RETURNING id INTO client_role_id;

  -- Assign permissions to Admin role (all permissions)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000010', id
  FROM permissions
  ON CONFLICT DO NOTHING;

  -- Assign permissions to UX Researcher role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000020', id
  FROM permissions
  WHERE key IN ('tickets.create', 'tickets.comment', 'tickets.view_internal')
  ON CONFLICT DO NOTHING;

  -- Assign permissions to Developer role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000030', id
  FROM permissions
  WHERE key IN ('tickets.comment', 'tickets.change_status', 'tickets.view_internal')
  ON CONFLICT DO NOTHING;

  -- Assign permissions to Client role
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000040', id
  FROM permissions
  WHERE key IN ('tickets.comment')
  ON CONFLICT DO NOTHING;
END $$;

-- Create indexes for performance
CREATE INDEX idx_users_profile_org_id ON users_profile(org_id);
CREATE INDEX idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX idx_roles_org_id ON roles(org_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_scope ON user_roles(scope_type, scope_id);
CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_tickets_org_id ON tickets(org_id);
CREATE INDEX idx_tickets_project_id ON tickets(project_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_ticket_evidence_ticket_id ON ticket_evidence(ticket_id);
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_is_internal ON ticket_comments(is_internal);
CREATE INDEX idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

