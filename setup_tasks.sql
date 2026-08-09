-- 1. Create the Tasks Table
DROP TABLE IF EXISTS public.tasks CASCADE;
CREATE TABLE public.tasks (
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

-- 2. Insert some realistic sample tasks to instantly fix the dashboard
INSERT INTO public.tasks (title, description, status, priority, due_date)
VALUES 
  ('Fix Dashboard Loading Error', 'Create the tasks table so the dashboard can load stats properly.', 'Completed', 'Critical', now() - interval '1 day'),
  ('Design Neumorphic Task Board', 'Build a beautiful, premium grid of task cards using established neumorphic shadows.', 'In Progress', 'High', now() + interval '2 days'),
  ('Implement Task Modal', 'Add a Create Task button that opens a Neumorphic modal.', 'Not Started', 'Medium', now() + interval '4 days'),
  ('Connect to Supabase', 'Wire up the page to fetch tasks dynamically using Server Components.', 'Not Started', 'High', now() + interval '5 days');

-- 3. Enable RLS (Row Level Security) and add basic policies
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view tasks (for now, before we restrict by company)
CREATE POLICY "Enable read access for all authenticated users" ON public.tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert tasks
CREATE POLICY "Enable insert for authenticated users" ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update tasks
CREATE POLICY "Enable update for authenticated users" ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (true);
