# Queue Slip Deployment Notes

App Name: Queue Slip
Tagline: Claim a queue spot
Description: Claim a public queue number with queue name, note, wallet, and timestamp on Base for popups and small drops.

## After Base Gives `base:app_id`

Copy the meta tag to Codex. The app id must be written to:

- `src/app/layout.tsx`
- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BASE_APP_ID`

Then deploy once with the project token in `Vercel.txt`, deploy the contract, and write the contract address to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_QUEUE_SLIP_CONTRACT_ADDRESS`

## After Base Gives Builder Code

Write the Builder Code to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BUILDER_CODE`

Then run production deploy again.

## Required Vercel Production Env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0af8a87abfff0aca7b173c
NEXT_PUBLIC_BUILDER_CODE=replace_with_builder_code
NEXT_PUBLIC_QUEUE_SLIP_CONTRACT_ADDRESS=replace_with_queue_slip_contract_address
```

## Contract

```bash
npm run deploy:contract
```
