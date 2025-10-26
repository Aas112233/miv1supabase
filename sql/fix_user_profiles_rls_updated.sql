-- Create a function to check if a user is admin without causing recursion
create or replace function is_admin_user(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from user_profiles 
    where id = user_id 
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Drop existing policies
drop policy if exists "Users can view their own profile" on user_profiles;
drop policy if exists "Users can insert their own profile" on user_profiles;
drop policy if exists "Users can update their own profile" on user_profiles;
drop policy if exists "Admin users can view all profiles" on user_profiles;
drop policy if exists "Admin users can update any profile" on user_profiles;

-- Create policies
create policy "Users can view their own profile" on user_profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on user_profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on user_profiles
  for update using (auth.uid() = id);

-- Use the function to avoid recursion
create policy "Admin users can view all profiles" on user_profiles
  for select using (is_admin_user(auth.uid()));

-- Create policy allowing admins to update any profile
create policy "Admin users can update any profile" on user_profiles
  for update using (is_admin_user(auth.uid()));