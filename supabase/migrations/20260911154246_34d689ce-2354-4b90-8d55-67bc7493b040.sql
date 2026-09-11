
CREATE POLICY "equipe ve fotos da ordem" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ordem-fotos' AND (storage.foldername(name))[1] = private.dono_atual(auth.uid())::text);

CREATE POLICY "equipe envia fotos da ordem" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ordem-fotos' AND (storage.foldername(name))[1] = private.dono_atual(auth.uid())::text);

CREATE POLICY "equipe exclui fotos da ordem" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ordem-fotos' AND (storage.foldername(name))[1] = private.dono_atual(auth.uid())::text);
