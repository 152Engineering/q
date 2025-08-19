-- Create a function to calculate storage usage for admin portal
CREATE OR REPLACE FUNCTION public.get_user_storage_usage()
RETURNS TABLE (
  user_id uuid,
  storage_used_bytes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only allow Super Admin to call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.account_type = 'Super Admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Super Admin required.';
  END IF;

  RETURN QUERY
  SELECT 
    -- Extract user_id from the file path (assuming files are stored in user folders)
    CASE 
      -- For paths like "user_id/filename" or "bucket/user_id/filename"
      WHEN so.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        SUBSTRING(so.name FROM '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')::uuid
      -- For paths like "avatars/user_id/filename" 
      WHEN so.name ~ '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        SUBSTRING(so.name FROM '/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/')::uuid
      ELSE
        NULL
    END as user_id,
    COALESCE(SUM(so.metadata->>'size'::text)::bigint, 0) as storage_used_bytes
  FROM storage.objects so
  WHERE so.name IS NOT NULL
    AND (
      so.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' OR
      so.name ~ '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    )
  GROUP BY 
    CASE 
      WHEN so.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        SUBSTRING(so.name FROM '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')::uuid
      WHEN so.name ~ '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        SUBSTRING(so.name FROM '/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/')::uuid
      ELSE
        NULL
    END
  HAVING 
    CASE 
      WHEN so.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        SUBSTRING(so.name FROM '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')::uuid
      WHEN so.name ~ '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' THEN
        SUBSTRING(so.name FROM '/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/')::uuid
      ELSE
        NULL
    END IS NOT NULL;
END;
$$;