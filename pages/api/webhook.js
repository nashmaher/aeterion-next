-- Add missing columns to orders table
alter table orders add column if not exists ambassador_id text;
alter table orders add column if not exists promo_code text;
alter table orders add column if not exists user_id text;
alter table orders add column if not exists customer_phone text;
alter table orders add column if not exists shipping_address jsonb;

-- Fix commissions table - make discount_amount nullable
alter table ambassador_commissions 
  alter column discount_amount drop not null;

-- Confirm structure
select table_name, column_name, data_type, is_nullable 
from information_schema.columns 
where table_name in ('orders', 'ambassador_commissions')
order by table_name, column_name;
