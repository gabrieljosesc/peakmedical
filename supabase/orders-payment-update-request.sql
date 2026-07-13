-- Admin can request updated payment details for an order (e.g. card declined).
-- Set when admin clicks "Request updated payment"; cleared when the customer
-- submits a new card for the order.
--
-- Run once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/iebpxtbrcsbgadwyrqqi/sql/new

alter table public.orders
  add column if not exists payment_update_requested_at timestamptz;

comment on column public.orders.payment_update_requested_at is
  'Set when the team requests updated payment for the order; cleared when the customer submits a new card.';
