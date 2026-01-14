# Brew Buddy Reference API

This service powers the living documentation scenarios under `examples/.features`.

## Requirements

- Expose REST endpoints for menu, recipes, inventory, orders, loyalty, and tasting notes.
- Provide deterministic seed data so scenarios can reset to a known baseline.
- Support Docker-based execution for CI workflows.

## Proposed Endpoints

| Resource  | Methods | Notes |
|-----------|---------|-------|
| `/menu`   | GET     | List current menu items. |
| `/menu`   | POST    | Create seasonal drinks. |
| `/menu/{drink}` | DELETE | Retire drinks. |
| `/menu/prices` | PATCH | Bulk price updates. |
| `/orders` | POST    | Create orders. |
| `/orders/{id}` | GET | Retrieve order details. |
| `/inventory/{item}` | PATCH/DELETE | Manage stock levels. |
| `/recipes` | POST/GET | Register recipes and tasting notes. |
| `/loyalty/{email}` | GET/PATCH | Manage loyalty points. |

## Next Steps

1. Define OpenAPI contract covering the feature scenarios.
2. Implement an in-memory service with persistence adapters for future expansion.
3. Provide a CLI to seed, reset, and teardown data between scenarios.
