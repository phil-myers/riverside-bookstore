-- Product A: loyalty points — earn on order placement — see SPEC.md.
--
-- reward_points is already part of the shared schema (docs/schema/riverside-books-schema.md,
-- team-signed-off) but was never actually implemented in Product A's customers table. This adds
-- the column; it is not a new schema proposal.
--
-- Rate: 1 point per $1 spent, floored on the order's TOTAL (not per line item), so e.g. two
-- $0.60 items ($1.20 total) correctly earn 1 point instead of losing points to per-item rounding
-- (floor(0.60) + floor(0.60) = 0).

alter table customers add column if not exists reward_points integer not null default 0;

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
  v_price numeric;
  v_order_total numeric := 0;
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

    select stock_quantity, title, price into v_available, v_title, v_price
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

    v_order_total := v_order_total + (v_price * v_quantity);
  end loop;

  update customers set reward_points = reward_points + floor(v_order_total) where customer_id = v_customer_id;

  return v_order_id;
end;
$$;
