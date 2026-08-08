CREATE TABLE public.frames (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  anime_id text NOT NULL,
  title text NOT NULL,
  episode integer NOT NULL,
  part integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow public read access on frames"
  ON public.frames
  FOR SELECT
  USING (true);

-- Allow insert/update/delete (Admin UI is protected by front-end password)
CREATE POLICY "Allow public insert on frames"
  ON public.frames
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete on frames"
  ON public.frames
  FOR DELETE
  USING (true);
