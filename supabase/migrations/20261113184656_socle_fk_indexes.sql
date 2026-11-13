create index if not exists boxes_created_by_idx on public.boxes(created_by);
create index if not exists invitations_coach_id_idx on public.invitations(coach_id);
create index if not exists invitations_created_by_idx on public.invitations(created_by);
