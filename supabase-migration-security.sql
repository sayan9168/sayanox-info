-- =============================================================================
-- Sayanox Info — Security Hardening Migration
-- Idempotent: safe to re-run in Supabase SQL Editor
-- Date: 2026-11-16
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper functions (SECURITY DEFINER, fixed search_path)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_mod()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_or_mod() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_mod() TO authenticated;

-- ---------------------------------------------------------------------------
-- 1. Privilege Escalation Protection — profiles.role
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

CREATE OR REPLACE FUNCTION public.set_user_role(target_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can set user roles'
      USING ERRCODE = '42501';
  END IF;

  IF new_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', target_id
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Moderation Bypass Protection — pages INSERT / UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_page_status_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_mod() THEN
    NEW.status := 'pending';
  END IF;
  IF NEW.author_id IS DISTINCT FROM auth.uid() THEN
    NEW.author_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_page_status_on_insert_trigger ON public.pages;
CREATE TRIGGER enforce_page_status_on_insert_trigger
  BEFORE INSERT ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_page_status_on_insert();

CREATE OR REPLACE FUNCTION public.enforce_page_status_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_mod() THEN
    NEW.author_id := OLD.author_id;
  END IF;

  IF NOT public.is_admin_or_mod() THEN
    IF (NEW.title IS DISTINCT FROM OLD.title) OR (NEW.content IS DISTINCT FROM OLD.content) THEN
      NEW.status := 'pending';
    ELSE
      NEW.status := OLD.status;
    END IF;
  END IF;

  IF NOT public.is_admin_or_mod() THEN
    IF (NEW.title IS DISTINCT FROM OLD.title) OR (NEW.content IS DISTINCT FROM OLD.content) THEN
      NEW.version := OLD.version + 1;
    ELSE
      NEW.version := OLD.version;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_page_status_on_update_trigger ON public.pages;
CREATE TRIGGER enforce_page_status_on_update_trigger
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_page_status_on_update();

-- ---------------------------------------------------------------------------
-- 3. page_versions SELECT / INSERT hardening
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Versions viewable with page" ON public.page_versions;
DROP POLICY IF EXISTS "Authenticated can insert versions" ON public.page_versions;
DROP POLICY IF EXISTS "page_versions_select" ON public.page_versions;
DROP POLICY IF EXISTS "page_versions_insert" ON public.page_versions;

CREATE POLICY "page_versions_select"
  ON public.page_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id
        AND (
          p.status = 'published'
          OR p.author_id = auth.uid()
          OR public.is_admin_or_mod()
        )
    )
  );

CREATE POLICY "page_versions_insert"
  ON public.page_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_id
        AND (
          p.author_id = auth.uid()
          OR public.is_admin_or_mod()
        )
        AND version = p.version
    )
  );

-- ---------------------------------------------------------------------------
-- 4. DELETE policies (admin/mod only)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "pages_delete_admin" ON public.pages;
CREATE POLICY "pages_delete_admin"
  ON public.pages
  FOR DELETE
  USING (public.is_admin_or_mod());

DROP POLICY IF EXISTS "page_versions_delete_admin" ON public.page_versions;
CREATE POLICY "page_versions_delete_admin"
  ON public.page_versions
  FOR DELETE
  USING (public.is_admin_or_mod());

-- ---------------------------------------------------------------------------
-- 5. Slug validation constraint
-- ---------------------------------------------------------------------------

ALTER TABLE public.pages DROP CONSTRAINT IF EXISTS pages_slug_format_check;

ALTER TABLE public.pages
  ADD CONSTRAINT pages_slug_format_check
  CHECK (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND char_length(slug) BETWEEN 3 AND 80
  );
