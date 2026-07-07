-- Admin-authored note shown to the customer on their order page.
-- Run once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/iebpxtbrcsbgadwyrqqi/sql/new

alter table public.orders
  add column if not exists customer_visible_note text;

comment on column public.orders.customer_visible_note is
  'Optional message from the team, shown to the customer on their order page.';
