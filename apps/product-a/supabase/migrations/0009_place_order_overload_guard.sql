-- Product A: defensive guard against place_order's old insecure overload — see /review finding.
--
-- 0007 does `create or replace function place_order(p_items jsonb)`, which only replaces a
-- function of that exact arity. If these migrations are ever applied to a fresh project out of
-- numeric order (0007 before 0006 — plausible in this project's manual, single-operator,
-- copy-into-SQL-Editor workflow), the old place_order(text, jsonb) — which trusted a
-- client-supplied customer_id with no ownership check — would still exist as a separate,
-- callable overload alongside the new one, silently reopening that gap. This guard makes
-- dropping it idempotent regardless of application order. No-op on this project today (0006
-- already dropped it in the correct order).

drop function if exists place_order(text, jsonb);
