create policy "profil : lire soi et son équipe" on public.profiles for select to authenticated using (id = (select auth.uid()) or private.shares_box(id));
create policy "profil : modifier soi" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "admin plateforme : se voir" on public.platform_admins for select to authenticated using (user_id = (select auth.uid()));

create policy "salle : membres lisent" on public.boxes for select to authenticated using (private.is_member(id));
create policy "salle : owner modifie" on public.boxes for update to authenticated using (private.is_owner(id)) with check (private.is_owner(id));
create policy "salle : owner supprime" on public.boxes for delete to authenticated using (private.is_owner(id));

create policy "membres : lecture" on public.box_members for select to authenticated using (private.is_member(box_id));
create policy "membres : owner ajoute" on public.box_members for insert to authenticated with check (private.is_owner(box_id));
create policy "membres : owner modifie" on public.box_members for update to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "membres : owner retire" on public.box_members for delete to authenticated using (private.is_owner(box_id));

create policy "invitations : owner" on public.invitations for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "réglages privés : owner" on public.box_private for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));

create policy "coachs : membres lisent" on public.coaches for select to authenticated using (private.is_member(box_id));
create policy "coachs : owner écrit" on public.coaches for insert to authenticated with check (private.is_owner(box_id));
create policy "coachs : owner modifie" on public.coaches for update to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "coachs : owner supprime" on public.coaches for delete to authenticated using (private.is_owner(box_id));

create policy "observations : owner" on public.observations for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "réunions : owner" on public.meetings for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "rappels : owner" on public.reminders for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));

create policy "actions : lecture" on public.actions for select to authenticated using (private.is_owner(box_id) or (private.is_member(box_id) and (assignee = 'equipe' or assignee = private.my_coach(box_id)::text)));
create policy "actions : owner crée" on public.actions for insert to authenticated with check (private.is_owner(box_id));
create policy "actions : mise à jour" on public.actions for update to authenticated using (private.is_owner(box_id) or (private.is_member(box_id) and (assignee = 'equipe' or assignee = private.my_coach(box_id)::text))) with check (private.is_member(box_id));
create policy "actions : owner supprime" on public.actions for delete to authenticated using (private.is_owner(box_id));

create policy "types : membres lisent" on public.course_types for select to authenticated using (private.is_member(box_id));
create policy "types : owner écrit" on public.course_types for insert to authenticated with check (private.is_owner(box_id));
create policy "types : owner modifie" on public.course_types for update to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "types : owner supprime" on public.course_types for delete to authenticated using (private.is_owner(box_id));

create policy "cours : membres lisent" on public.courses for select to authenticated using (private.is_member(box_id));
create policy "cours : owner écrit" on public.courses for insert to authenticated with check (private.is_owner(box_id));
create policy "cours : owner modifie" on public.courses for update to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "cours : owner supprime" on public.courses for delete to authenticated using (private.is_owner(box_id));

create policy "fréquentation : owner" on public.attendance for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));

create policy "essais : lecture" on public.trials for select to authenticated using (private.is_owner(box_id) or (coach_id is not null and coach_id = private.my_coach(box_id)));
create policy "essais : ajout" on public.trials for insert to authenticated with check (private.is_owner(box_id) or (private.is_member(box_id) and coach_id = private.my_coach(box_id)));
create policy "essais : mise à jour" on public.trials for update to authenticated using (private.is_owner(box_id) or (coach_id is not null and coach_id = private.my_coach(box_id))) with check (private.is_member(box_id));
create policy "essais : owner supprime" on public.trials for delete to authenticated using (private.is_owner(box_id));

create policy "événements : membres lisent" on public.events for select to authenticated using (private.is_member(box_id));
create policy "événements : owner écrit" on public.events for insert to authenticated with check (private.is_owner(box_id));
create policy "événements : owner modifie" on public.events for update to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "événements : owner supprime" on public.events for delete to authenticated using (private.is_owner(box_id));
create policy "finances événement : owner" on public.event_finance for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));

create policy "tâches : membres lisent" on public.event_tasks for select to authenticated using (private.is_member(box_id));
create policy "tâches : owner crée" on public.event_tasks for insert to authenticated with check (private.is_owner(box_id));
create policy "tâches : mise à jour" on public.event_tasks for update to authenticated using (private.is_owner(box_id) or (private.is_member(box_id) and (assignee = 'equipe' or assignee = private.my_coach(box_id)::text))) with check (private.is_member(box_id));
create policy "tâches : owner supprime" on public.event_tasks for delete to authenticated using (private.is_owner(box_id));

create policy "adhérents : owner" on public.members for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));
create policy "ventes : owner" on public.sales for all to authenticated using (private.is_owner(box_id)) with check (private.is_owner(box_id));

create policy "suivi 60 j : lecture" on public.onboarding for select to authenticated using (private.is_owner(box_id) or (coach_id is not null and coach_id = private.my_coach(box_id)));
create policy "suivi 60 j : owner crée" on public.onboarding for insert to authenticated with check (private.is_owner(box_id));
create policy "suivi 60 j : mise à jour" on public.onboarding for update to authenticated using (private.is_owner(box_id) or (coach_id is not null and coach_id = private.my_coach(box_id))) with check (private.is_member(box_id));
create policy "suivi 60 j : owner supprime" on public.onboarding for delete to authenticated using (private.is_owner(box_id));

create policy "journal : lecture" on public.journal for select to authenticated using (private.is_owner(box_id) or actor = (select auth.uid()));
create policy "journal : ajout" on public.journal for insert to authenticated with check (private.is_member(box_id) and actor = (select auth.uid()));
create policy "journal : owner supprime" on public.journal for delete to authenticated using (private.is_owner(box_id));
