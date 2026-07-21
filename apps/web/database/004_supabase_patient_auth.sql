alter table app_users
  add column if not exists supabase_user_id uuid unique;

create index if not exists app_users_supabase_user_id_idx on app_users(supabase_user_id);
