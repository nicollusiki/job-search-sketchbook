
CREATE POLICY "own proof upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own proof read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own proof delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
