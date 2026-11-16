# Security Model — Sayanox Info

**Threat model**: All database access from the browser uses the Supabase **anon key**.  
RLS + triggers + SECURITY DEFINER helpers are the **only** security boundary.  
Every client is treated as hostile.

---

## Fixes Applied (2026-11-16)

### FIX 1 — Privilege Escalation via `profiles.role` (CRITICAL)

**Problem**: The policy `"Users can update own profile"` allowed  
`UPDATE profiles SET role = 'admin' WHERE id = auth.uid()`.

**Solution**:
- `BEFORE UPDATE` trigger `protect_profile_role_trigger` raises if `role` changes and the caller is not an admin.
- Helper `public.is_admin()` (SECURITY DEFINER, fixed `search_path`) avoids RLS recursion.
- Admin-only RPC `public.set_user_role(target_id, new_role)` for legitimate role changes.
- EXECUTE on the RPC is granted only to `authenticated`; revoked from `PUBLIC` / `anon`.

### FIX 2 — Moderation Bypass on page INSERT/UPDATE (CRITICAL)

**Problem**: Client code decided `status`. Direct API calls could insert `status = 'published'`.

**Solution**:
- `BEFORE INSERT` trigger forces `NEW.status := 'pending'` unless caller is admin/moderator.
- Also forces `author_id = auth.uid()` to prevent spoofing.
- `BEFORE UPDATE` trigger:
  - Non-admins cannot change `status` freely.
  - Any content/title change by a non-admin resets status to `'pending'`.
  - `author_id` is locked for non-admins.
  - `version` is auto-managed for non-admins.
- `src/app/new/page.tsx` no longer sends `status`; relies on DB default + trigger.

### FIX 3 — Unpublished Content Leak via `page_versions` (HIGH)

**Problem**: `SELECT` policy was `USING (true)`.

**Solution**:
- New policy requires the parent page to be `published` **or** the caller is the author **or** admin/mod.
- `INSERT` restricted to page author or admin/mod, and `version` must match the current page version.

### FIX 4 — Missing DELETE policy (MEDIUM)

- `DELETE` on `pages` and `page_versions` allowed only for admin/moderator via `is_admin_or_mod()`.
- Admin UI: Delete button with `window.confirm` on rejected pages.

### FIX 5 — Slug validation (MEDIUM)

- DB `CHECK` constraint: `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'` and length 3–80.
- Client-side normalization + validation in `new/page.tsx` before insert.

### FIX 6 — Outdated Next.js (HIGH)

- Upgraded `next` and `eslint-config-next` from `15.2.4` → `15.5.29` (Maintenance LTS with latest security patches).
- CVE-2025-29927 (middleware bypass via `x-middleware-subrequest`) was already fixed in ≥ 15.2.3; the upgrade brings additional later patches.

---

## Verification Snippets

Run these while authenticated as a **normal user** (role = `'user'`).  
All of the following **must fail**.

```sql
-- 1. Privilege escalation (must raise)
UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();

-- 2. Direct publish on insert (status will be forced to 'pending' by trigger)
INSERT INTO public.pages (slug, title, content, author_id, status)
VALUES ('evil-page', 'Evil', 'content', auth.uid(), 'published')
RETURNING status;  -- expect 'pending'

-- 3. Self-publish via update (must keep/restore pending)
UPDATE public.pages SET status = 'published'
WHERE author_id = auth.uid() AND status = 'pending';

-- 4. Read another user's unpublished versions (must return 0 rows)
SELECT * FROM public.page_versions
WHERE page_id IN (
  SELECT id FROM public.pages
  WHERE status != 'published' AND author_id != auth.uid()
);

-- 5. Delete any page (must fail)
DELETE FROM public.pages WHERE true;
```

These **must succeed** (as admin or after proper flow):

```sql
-- Normal user insert → stored as pending
INSERT INTO public.pages (slug, title, content, author_id)
VALUES ('test-page', 'Test', 'Hello', auth.uid())
RETURNING status;  -- 'pending'

-- Admin sets role
SELECT public.set_user_role('some-user-uuid', 'moderator');

-- Admin approves
UPDATE public.pages SET status = 'published' WHERE slug = 'test-page';

-- Everyone can read versions of published pages
SELECT * FROM public.page_versions
WHERE page_id = (SELECT id FROM public.pages WHERE slug = 'test-page' AND status = 'published');
```

---

## Operational Notes

1. After deploying, run `supabase-migration-security.sql` on existing projects.
2. Fresh installs use the updated `supabase-schema.sql`.
3. Never expose the service-role key to the client.
4. First admin must be promoted manually once (via SQL or dashboard) after signup:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = '<your-uuid>';
   ```
   (This UPDATE succeeds only when run with elevated privileges / service role, or by an existing admin via the RPC.)

## Reporting

Report vulnerabilities privately to the repository maintainers.
