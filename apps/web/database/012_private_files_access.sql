-- Storage is an account service, in addition to the existing role permissions.
-- Existing objects and folders are preserved for every account.
alter table app_users add column drive_enabled boolean not null default false;

do $$
begin
 if current_database()='nogueira_app' and not exists (
   select 1 from app_users where id='4d6a92f6-2a80-428e-84be-d2369de3c22f'
   and email='drpaulo@nogueiracardiologia.com.br' and is_active
 ) then
   raise exception 'The authorized storage account could not be verified';
 end if;
end $$;

update app_users set drive_enabled=true
 where id='4d6a92f6-2a80-428e-84be-d2369de3c22f'
 and email='drpaulo@nogueiracardiologia.com.br' and is_active;

update permissions set description='Gerenciar arquivos privados somente quando o armazenamento estiver habilitado para a conta'
 where id='files.access';

insert into audit_logs(action,entity_type,entity_id,before_data,after_data,metadata)
 select 'files.access.enable','app_users',id,'{"drive_enabled":false}',
 '{"drive_enabled":true}','{"migration":"012_private_files_access.sql"}'
 from app_users where drive_enabled;
