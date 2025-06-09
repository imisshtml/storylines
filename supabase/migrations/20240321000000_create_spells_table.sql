-- Create trigger function for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create the spells table
create table if not exists public.spells (
  id uuid default gen_random_uuid() primary key,
  index text unique not null,
  name text not null,
  level integer not null,
  school text not null,
  casting_time text not null,
  range text not null,
  components text[] not null,
  duration text not null,
  description text[] not null,
  higher_level text[],
  material text,
  ritual boolean default false,
  concentration boolean default false,
  classes text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.spells enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.spells
  for select using (true);

-- Add policy for inserting spells (temporary for initial population)
create policy "Enable insert for initial population" on public.spells
  for insert to anon
  with check (true);

-- Create updated_at trigger
create trigger handle_updated_at before update on public.spells
  for each row execute function update_updated_at_column();

-- Create index on commonly queried fields
create index spells_level_idx on public.spells(level);
create index spells_school_idx on public.spells(school);
create index spells_name_idx on public.spells(name);

-- Note: After populating the data, you may want to drop this policy and create a more restrictive one:
-- drop policy "Enable insert for initial population" on public.spells;
-- create policy "Enable insert for authenticated users only" on public.spells
--   for insert with check (auth.role() = 'authenticated'); 