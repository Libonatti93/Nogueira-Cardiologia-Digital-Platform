alter table appointments
  add column if not exists modality text not null default 'in_person';

do $$
begin
  alter table appointments
    add constraint appointments_modality_check
    check (modality in ('in_person', 'telemedicine'));
exception
  when duplicate_object then null;
end $$;

create index if not exists appointments_modality_schedule_idx
  on appointments(modality, scheduled_for);
