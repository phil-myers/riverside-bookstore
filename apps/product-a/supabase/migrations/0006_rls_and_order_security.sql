-- Product A: RLS policies + place_order hardening.
--
-- Discovered wiring this project up to a real Supabase project: newer projects enable RLS by
-- default on new tables with zero policies, which silently blocks every query (PostgREST returns
-- empty results, not an error) — books, customers, orders, order_items were all unreadable. This
-- adds the minimum policy each table actually needs for the app's existing query patterns
-- (lib/books.ts, lib/auth.ts, lib/orders.ts).
--
-- Separately found while writing this: place_order took customer_id as a plain client-supplied
-- parameter with nothing checking it matched whoever was actually signed in — any authenticated
-- user could call the RPC with someone else's customer_id. Fixed by deriving customer_id from
-- auth.uid() (the caller's own session) inside the function instead of trusting the argument.

alter table books enable row level security;
create policy "books are publicly readable" on books
  for select using (true);

alter table customers enable row level security;
create policy "users can insert their own customer row" on customers
  for insert with check (auth.uid() = auth_user_id);
create policy "users can view their own customer row" on customers
  for select using (auth.uid() = auth_user_id);

alter table orders enable row level security;
create policy "users can view their own orders" on orders
  for select using (
    customer_id in (select customer_id from customers where auth_user_id = auth.uid())
  );

alter table order_items enable row level security;
create policy "users can view their own order items" on order_items
  for select using (
    order_id in (
      select order_id from orders
      where customer_id in (select customer_id from customers where auth_user_id = auth.uid())
    )
  );

-- No insert/update policies on orders/order_items/books for the authenticated role — by design.
-- Every write goes through this one function instead, so there's exactly one audited path that
-- can create an order or move stock, matching the original order-placement spec's invariant.
drop function if exists place_order(text, jsonb);

create or replace function place_order(p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id text;
  v_order_id text;
  v_item jsonb;
  v_isbn text;
  v_quantity integer;
  v_available integer;
  v_title text;
begin
  select customer_id into v_customer_id from customers where auth_user_id = auth.uid();

  if v_customer_id is null then
    raise exception 'No customer record for the current user';
  end if;

  insert into orders (customer_id) values (v_customer_id) returning order_id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_isbn := v_item ->> 'isbn';
    v_quantity := (v_item ->> 'quantity')::integer;

    select stock_quantity, title into v_available, v_title
    from books
    where isbn = v_isbn
    for update;

    if v_available is null then
      raise exception 'No book found for ISBN %', v_isbn;
    end if;

    if v_available < v_quantity then
      raise exception 'Not enough stock for "%": % requested, % available', v_title, v_quantity, v_available;
    end if;

    update books set stock_quantity = stock_quantity - v_quantity where isbn = v_isbn;

    insert into order_items (order_id, isbn, quantity) values (v_order_id, v_isbn, v_quantity);
  end loop;

  return v_order_id;
end;
$$;
