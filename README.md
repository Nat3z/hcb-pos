# HCB PoS

A self-hosted point of sale platform for [HCB](https://hcb.hackclub.com).

## Why?

HCB PoS is intended to be a viable self-hosted platform for handling checkout and order fulfillment for HCB. We use your HCB auth token to
read your HCB organization's details (that aren't publicly available) and verify orders and send webhooks to fulfill them.

With HCB PoS, you can:

1. Create checkout pages for your organization
1. Use webhooks to fulfill orders
1. Multi-organization support to handle orders for hundreds of organizations
1. An API to create orders for your products.

## Userscript

Use the provided userscript to automatically provide HCB PoS your session token to avoid having to manually link it. Simply load into HCB and it will sync with HCB PoS.

```text
https://raw.githubusercontent.com/nat3z/hcb-pos/main/userscript.user.js
```

## Self-Hosting

To use HCB PoS, you need to clone the git repository locally and use docker compose to run the application. Using the `prod.migrations.sh` script will run the migrations required for the database.

```bash
git clone https://github.com/nat3z/hcb-pos.git
cd hcb-pos
docker compose build
chmod +x prod.migrations.sh
./prod.migrations.sh
docker compose up -d
```

## Cloud Hosting

HCB PoS currently does not have a cloud hosting option. Any HCB PoS instance by default, can be used to host multiple organizations and are open to the public.

## API Usage

HCB PoS has a REST API to manage orders and products. You can use the API to create orders for your products and manage your organization's products and orders.

To get an API key, run the 'api' command on the page.

### Order Management

To create an order, you can use the `POST /api/orders` endpoint.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"productId": "<PRODUCT_ID>"}'
```

You can then redirect uesrs to `https://<HCB_POS_INSTANCE>/checkout/<orderId>` to bring them to the checkout page.

To get an order's status, you can use the `GET /api/orders` endpoint.

```bash
curl -X GET http://localhost:3000/api/orders?orderId=<ORDER_ID> \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json"
```

### Products

To view what products are available, you can use the `GET /api/products` endpoint.

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json"
```
