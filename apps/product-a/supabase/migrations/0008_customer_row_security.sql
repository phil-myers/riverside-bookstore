-- Product A: harden customer row creation — see /review finding.
--
-- The customers INSERT policy from 0006 only checked auth.uid() = auth_user_id — it didn't
-- constrain any other column. Since Supabase grants full-row INSERT to the authenticated role
-- by default, any signed-up user could call supabase.from('customers').insert({ auth_user_id:
-- <own>, reward_points: 999999 }) directly, before the app's own ensureCustomerRow ran its
-- default-valued insert, and self-grant an arbitrary reward_points balance. Same bug class as
-- place_order's original client-supplied customer_id issue — closed the same way: route the
-- write through a security definer function instead of trusting a client-supplied value, and
-- drop the direct-insert policy so the function is the only path (matching orders/order_items).

drop policy if exists "users can insert their own customer row" on customers;

create or replace function create_customer_row()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id text;
begin
  select customer_id into v_customer_id from customers where auth_user_id = auth.uid();

  if v_customer_id is not null then
    return v_customer_id;
  end if;

  insert into customers (auth_user_id) values (auth.uid()) returning customer_id into v_customer_id;
  return v_customer_id;
end;
$$;
