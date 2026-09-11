ALTER TABLE public.projetos REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='projetos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projetos;
  END IF;
END $$;