with user_payload as (
  select *
  from (
    values
      ('a1111111-1111-1111-1111-111111111111'::uuid, 'organizer@seed.cbd', 'organizer'),
      ('b2222222-2222-2222-2222-222222222222'::uuid, 'producteur1@seed.cbd', 'producer'),
      ('c3333333-3333-3333-3333-333333333333'::uuid, 'producteur2@seed.cbd', 'producer'),
      ('d4444444-4444-4444-4444-444444444444'::uuid, 'judge1@seed.cbd', 'judge'),
      ('e5555555-5555-5555-5555-555555555555'::uuid, 'judge2@seed.cbd', 'judge'),
      ('f7777777-7777-7777-7777-777777777777'::uuid, 'membre@seed.cbd', 'viewer')
  ) as t(id, email, role)
)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
)
select
  id,
  '00000000-0000-0000-0000-000000000000',
  email,
  crypt('SupabaseSeed#2025', gen_salt('bf')),
  timezone('utc', now()),
  timezone('utc', now()),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object(),
  'authenticated',
  'authenticated',
  timezone('utc', now()),
  timezone('utc', now())
from user_payload
on conflict (id) do nothing;

insert into public.profiles (id, display_name, role, organization, is_verified)
values
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'Équipe CBD Flower Cup', 'organizer', 'CBD Flower Cup', true),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'Maison Terpènes', 'producer', 'Maison Terpènes', true),
  ('c3333333-3333-3333-3333-333333333333'::uuid, 'Collectif Alpestre', 'producer', 'Collectif Alpestre', true),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'Camille Leblanc', 'judge', 'Sensoriel Lab', true),
  ('e5555555-5555-5555-5555-555555555555'::uuid, 'Lina Duarte', 'judge', 'Terpene Masters', true),
  ('f7777777-7777-7777-7777-777777777777'::uuid, 'Membre Communauté', 'viewer', null, true)
on conflict (id) do nothing;

insert into public.contests (id, slug, name, description, status, location, start_date, end_date, registration_close_date, prize_pool, created_by)
values (
  'f6666666-6666-6666-6666-666666666666'::uuid,
  'paris-2025',
  'CBD Flower Cup Paris 2025',
  'Édition premium réunissant les meilleurs producteurs européens.',
  'registration',
  'Paris, France',
  '2025-03-01T09:00:00Z',
  '2025-03-15T18:00:00Z',
  '2025-02-15T23:59:59Z',
  15000,
  'a1111111-1111-1111-1111-111111111111'::uuid
)
on conflict (id) do update set
  status = excluded.status,
  description = excluded.description,
  updated_at = timezone('utc', now());

insert into public.entries (id, contest_id, producer_id, strain_name, cultivar, category, thc_percent, cbd_percent, terpene_profile, status, submission_notes)
values
  (
    '11111111-aaaa-bbbb-cccc-111111111111'::uuid,
    'f6666666-6666-6666-6666-666666666666'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'Emerald Velvet',
    'Velvet Kush',
    'indica',
    0.25,
    14.2,
    'Myrcene, Limonene, Caryophyllene',
    'approved',
    'COA et photos à jour.'
  ),
  (
    '22222222-bbbb-cccc-dddd-222222222222'::uuid,
    'f6666666-6666-6666-6666-666666666666'::uuid,
    'c3333333-3333-3333-3333-333333333333'::uuid,
    'Alpine Breeze',
    'Swiss Dream',
    'sativa',
    0.22,
    16.5,
    'Pinene, Linalool, Humulene',
    'approved',
    'Culture outdoor biodynamique.'
  )
on conflict (id) do update set
  status = excluded.status,
  submission_notes = excluded.submission_notes,
  updated_at = timezone('utc', now());

insert into public.contest_judges (contest_id, judge_id, invitation_status, judge_role)
values
  ('f6666666-6666-6666-6666-666666666666'::uuid, 'd4444444-4444-4444-4444-444444444444'::uuid, 'accepted', 'head_judge'),
  ('f6666666-6666-6666-6666-666666666666'::uuid, 'e5555555-5555-5555-5555-555555555555'::uuid, 'accepted', 'judge')
on conflict (contest_id, judge_id) do update set
  invitation_status = excluded.invitation_status;

insert into public.judge_scores (id, entry_id, judge_id, appearance_score, aroma_score, taste_score, effect_score, overall_score, notes)
values
  (
    'aaaa1111-2222-3333-4444-555555555555'::uuid,
    '11111111-aaaa-bbbb-cccc-111111111111'::uuid,
    'd4444444-4444-4444-4444-444444444444'::uuid,
    92, 95, 90, 88, 91,
    'Texture parfaite, terpènes très présents.'
  ),
  (
    'bbbb2222-3333-4444-5555-666666666666'::uuid,
    '22222222-bbbb-cccc-dddd-222222222222'::uuid,
    'e5555555-5555-5555-5555-555555555555'::uuid,
    88, 86, 89, 90, 88,
    'Profil aromatique frais, belle complexité.'
  )
on conflict (id) do update set
  overall_score = excluded.overall_score,
  notes = excluded.notes;

insert into public.public_votes (id, entry_id, voter_profile_id, score, comment)
values
  ('99999999-aaaa-bbbb-cccc-999999999999'::uuid, '11111111-aaaa-bbbb-cccc-111111111111'::uuid, 'f7777777-7777-7777-7777-777777777777'::uuid, 5, 'Saveurs incroyables !'),
  ('88888888-bbbb-cccc-dddd-888888888888'::uuid, '22222222-bbbb-cccc-dddd-222222222222'::uuid, 'f7777777-7777-7777-7777-777777777777'::uuid, 4, 'Très doux, finale florale.')
on conflict (id) do update set
  score = excluded.score,
  comment = excluded.comment;

