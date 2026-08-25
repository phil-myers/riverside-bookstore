# Marketing Content Generator (Product D)

Part of Team 5's four-product suite for Riverside Books Bookstore.

## What it does

Generates marketing content: email campaigns, social posts, and event
promos for the bookstore's customers.

## Role in the suite

This is Product D in the suite, pulling shared customer, inventory, and
loyalty data from the other three products:

- **Product A, Customer Ordering & Loyalty App** (Jeffrey de la Cruz):
  supplies `customer_id`, `signup_date`, `order_status`, `reward_points`
  for audience targeting and loyalty-based campaigns
- **Product B, Staff Inventory & Ops Dashboard** (Philip Myers):
  supplies `ISBN`, `Non Book UPC`, `stock_quantity` for product-based
  campaigns
- **Product C, Customer Support Chatbot** (Priscilla): data relationship
  to this product still being confirmed
- **Event data** (`Author Events`, `Ticket ID`): drives author event and
  book-signing promos

## Shared data contract

| Column | Format | Example |
|---|---|---|
| customer_id | TEXT, format `cust_XXXXX` | cust_00042 |
| signup_date | DATE, `YYYY-MM-DD` | 2026-03-14 |
| ISBN | TEXT, 13-digit with hyphens | 978-1-56592-479-6 |
| Non Book UPC | TEXT, 12-digit barcode | 012345678905 |
| Author Events | TIMESTAMPTZ | 2026-03-14T18:30:00Z |
| Ticket ID | TEXT, format `tkt_XXXXX` | tkt_00042 |
| stock_quantity | INTEGER (must never be < 0) | 12 |
| order_id | TEXT, format `ord_XXXXX` | ord_98765 |
| order_status | ENUM: preorder, pending, Shipped, ready_for_pickup, Completed, cancelled — canonical enum, see `docs/schema/riverside-books-schema.md` | Completed |
| reward_points | INTEGER | 250 |

## Future Features (not yet built)

- **Social share button** (proposed in Product A's feature doc): a button
  inside Jeffrey's Ordering & Loyalty App that lets customers share a
  recent pre-order or loyalty milestone (e.g. crossing a `reward_points`
  threshold, `order_status` becoming `Completed`) to social media. This
  would require a new post-generation path in this product, separate from
  the current ISBN-based book announcement flow, since it generates
  milestone/order content instead of book content. Note: `Completed` now
  specifically means the customer has the book in hand — an in-store
  pickup order that's ready but not yet collected is `ready_for_pickup`,
  a distinct value, so this feature won't fire early for pickup orders.