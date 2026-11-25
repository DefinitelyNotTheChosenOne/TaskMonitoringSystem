-- ============================================================================
-- JRPCo Prime — Task Management System (Idempotent Schema Migration)
-- Safe to run multiple times in Supabase SQL Editor. Preserves existing rows.
-- ============================================================================

-- 1. Companies (Multi-tenant organizations)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT 'Team Task Management Workspace',
    mission TEXT NOT NULL DEFAULT 'Deliver high-quality, innovative solutions that empower teams to collaborate efficiently and stay organized every single day.',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies
    ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT 'Team Task Management Workspace',
    ADD COLUMN IF NOT EXISTS mission TEXT NOT NULL DEFAULT 'Deliver high-quality, innovative solutions that empower teams to collaborate efficiently and stay organized every single day.',
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Employees (Ensure table & full Team Data Sheet / HR columns exist)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    name TEXT NOT NULL,
    email TEXT,
    emp_id TEXT,
    department TEXT,
    position TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee',
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS emp_id TEXT,
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS position TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS date_of_hire DATE,
    ADD COLUMN IF NOT EXISTS home_address TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
    ADD COLUMN IF NOT EXISTS employee_status TEXT NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS tin TEXT;

-- 3. Tasks (Preserve existing setup_tasks.sql rows + add full TMS fields)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Not Started',
    priority TEXT NOT NULL DEFAULT 'Medium',
    assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS task_code TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Project',
    ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Operations',
    ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS assigned_on DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS remarks TEXT NOT NULL DEFAULT 'Open',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tasks_progress_range_check'
    ) THEN
        ALTER TABLE public.tasks
            ADD CONSTRAINT tasks_progress_range_check
            CHECK (progress >= 0 AND progress <= 100);
    END IF;
END $$;

-- Auto-incrementing human-readable task code sequence & lifecycle trigger
CREATE SEQUENCE IF NOT EXISTS public.task_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.tasks_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.task_code IS NULL OR btrim(NEW.task_code) = '' THEN
        NEW.task_code := 'TSK-' || lpad(nextval('public.task_code_seq')::text, 3, '0');
    END IF;

    IF NEW.assigned_on IS NULL THEN
        NEW.assigned_on := COALESCE(NEW.created_at::date, CURRENT_DATE);
    END IF;

    IF NEW.start_date IS NULL THEN
        NEW.start_date := NEW.assigned_on;
    END IF;

    IF NEW.status = 'Completed' THEN
        NEW.completed_at := COALESCE(NEW.completed_at, now());
        NEW.progress := 100;
        NEW.remarks := 'Closed';
    ELSE
        IF TG_OP = 'UPDATE' AND OLD.status = 'Completed' AND NEW.status <> 'Completed' THEN
            NEW.completed_at := NULL;
        END IF;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_before_write ON public.tasks;
CREATE TRIGGER trg_tasks_before_write
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.tasks_before_write();

-- Backfill existing tasks that lack task_code / dates / completed_at
WITH numbered AS (
    SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS rn
    FROM public.tasks
    WHERE task_code IS NULL OR btrim(task_code) = ''
)
UPDATE public.tasks t
SET
    task_code = 'TSK-' || lpad(numbered.rn::text, 3, '0'),
    assigned_on = COALESCE(t.assigned_on, t.created_at::date, CURRENT_DATE),
    start_date = COALESCE(t.start_date, t.assigned_on, t.created_at::date, CURRENT_DATE),
    completed_at = CASE WHEN t.status = 'Completed' THEN COALESCE(t.completed_at, t.created_at, now()) ELSE t.completed_at END,
    progress = CASE WHEN t.status = 'Completed' THEN 100 ELSE COALESCE(t.progress, 0) END,
    remarks = CASE WHEN t.status = 'Completed' THEN 'Closed' ELSE COALESCE(t.remarks, 'Open') END
FROM numbered
WHERE t.id = numbered.id;

SELECT setval(
    'public.task_code_seq',
    GREATEST(
        1,
        COALESCE((SELECT MAX(NULLIF(regexp_replace(task_code, '\D', '', 'g'), '')::bigint) FROM public.tasks), 0)
    ),
    true
);

-- 4. Subtasks & Comments
CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Workspace Customization Options (Categories & Departments)
CREATE TABLE IF NOT EXISTS public.workspace_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    option_type TEXT NOT NULL CHECK (option_type IN ('category', 'department')),
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_options_unique_idx
    ON public.workspace_options (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), option_type, lower(label));

-- 6. Meetings & Action Items (Ready for Milestone 2B)
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    meeting_no TEXT NOT NULL,
    title TEXT NOT NULL,
    objective TEXT,
    participants TEXT,
    organizer TEXT,
    meeting_date DATE,
    meeting_time TEXT,
    location TEXT,
    agenda JSONB NOT NULL DEFAULT '[]'::jsonb,
    minutes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    item_no TEXT NOT NULL DEFAULT '01',
    action_item TEXT NOT NULL,
    person_responsible TEXT,
    assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    objective TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'Not Started',
    linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Notifications (Ready for Milestone 2C)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    link_href TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_company_due ON public.tasks (company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task ON public.task_subtasks (task_id, position);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments (task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees (company_id, name);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_id, is_read, created_at DESC);

-- 9. Non-Recursive Security Definer RLS Helpers
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id FROM public.employees WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.employees WHERE id = auth.uid() LIMIT 1;
$$;

-- 10. Enable RLS & Apply Multi-Tenant Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Companies policies
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
CREATE POLICY "companies_select_policy" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

DROP POLICY IF EXISTS "companies_write_policy" ON public.companies;
CREATE POLICY "companies_write_policy" ON public.companies
    FOR ALL TO authenticated
    USING (
        public.current_user_role() = 'superadmin'
        OR (id = public.current_user_company_id() AND public.current_user_role() = 'admin')
    )
    WITH CHECK (
        public.current_user_role() = 'superadmin'
        OR (id = public.current_user_company_id() AND public.current_user_role() = 'admin')
    );

-- Employees policies
DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
CREATE POLICY "employees_select_policy" ON public.employees
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
CREATE POLICY "employees_insert_policy" ON public.employees
    FOR INSERT TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('admin', 'superadmin')
        AND (company_id = public.current_user_company_id() OR public.current_user_role() = 'superadmin')
    );

DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
CREATE POLICY "employees_update_policy" ON public.employees
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid()
        OR (public.current_user_role() = 'admin' AND company_id = public.current_user_company_id())
        OR public.current_user_role() = 'superadmin'
    )
    WITH CHECK (
        id = auth.uid()
        OR (public.current_user_role() = 'admin' AND company_id = public.current_user_company_id())
        OR public.current_user_role() = 'superadmin'
    );

-- Tasks policies (drop legacy open setup_tasks policies first)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;

CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

CREATE POLICY "tasks_insert_policy" ON public.tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

CREATE POLICY "tasks_update_policy" ON public.tasks
    FOR UPDATE TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

CREATE POLICY "tasks_delete_policy" ON public.tasks
    FOR DELETE TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

-- Task subtasks policies
DROP POLICY IF EXISTS "task_subtasks_all_policy" ON public.task_subtasks;
CREATE POLICY "task_subtasks_all_policy" ON public.task_subtasks
    FOR ALL TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

-- Task comments policies
DROP POLICY IF EXISTS "task_comments_all_policy" ON public.task_comments;
CREATE POLICY "task_comments_all_policy" ON public.task_comments
    FOR ALL TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

-- Workspace options policies
DROP POLICY IF EXISTS "workspace_options_select_policy" ON public.workspace_options;
CREATE POLICY "workspace_options_select_policy" ON public.workspace_options
    FOR SELECT TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

DROP POLICY IF EXISTS "workspace_options_write_policy" ON public.workspace_options;
CREATE POLICY "workspace_options_write_policy" ON public.workspace_options
    FOR ALL TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'superadmin')
        AND (company_id IS NULL OR company_id = public.current_user_company_id() OR public.current_user_role() = 'superadmin')
    )
    WITH CHECK (
        public.current_user_role() IN ('admin', 'superadmin')
        AND (company_id IS NULL OR company_id = public.current_user_company_id() OR public.current_user_role() = 'superadmin')
    );

-- Meetings & action items policies
DROP POLICY IF EXISTS "meetings_all_policy" ON public.meetings;
CREATE POLICY "meetings_all_policy" ON public.meetings
    FOR ALL TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

DROP POLICY IF EXISTS "meeting_action_items_all_policy" ON public.meeting_action_items;
CREATE POLICY "meeting_action_items_all_policy" ON public.meeting_action_items
    FOR ALL TO authenticated
    USING (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    )
    WITH CHECK (
        company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

-- Notifications policies
DROP POLICY IF EXISTS "notifications_own_policy" ON public.notifications;
CREATE POLICY "notifications_own_policy" ON public.notifications
    FOR ALL TO authenticated
    USING (recipient_id = auth.uid() OR public.current_user_role() = 'superadmin')
    WITH CHECK (
        recipient_id = auth.uid()
        OR company_id IS NULL
        OR company_id = public.current_user_company_id()
        OR public.current_user_role() = 'superadmin'
    );

-- 11. Storage Bucket for Task File Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "task_attachments_select" ON storage.objects;
CREATE POLICY "task_attachments_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "task_attachments_insert" ON storage.objects;
CREATE POLICY "task_attachments_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'task-attachments');

DROP POLICY IF EXISTS "task_attachments_delete" ON storage.objects;
CREATE POLICY "task_attachments_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'task-attachments');

-- 12. Explicit Schema, Table, Sequence & Function Grants (Fixes 42501 "permission denied for table ...")
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.companies,
    public.employees,
    public.tasks,
    public.task_subtasks,
    public.task_comments,
    public.workspace_options,
    public.meetings,
    public.meeting_action_items,
    public.notifications
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE
    public.companies,
    public.employees,
    public.tasks,
    public.task_subtasks,
    public.task_comments,
    public.workspace_options,
    public.meetings,
    public.meeting_action_items,
    public.notifications
TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.task_code_seq TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tasks_before_write() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
