# 16. Learner Wallet, Top-up & Promo Test Cases (16 cases — đã lọc)

**Module:** Wallet balance, top-up packages, payment orders, promo code redemption  
**Source:** `apps/backend-v2` WalletController, PaymentCallbackController; `apps/frontend-v3` wallet features, Header, TopUpDialog, PromoRedeemCard  
**Backend tests:** `Wallet/TopupFlowTest.php`, `Wallet/WalletServiceTest.php`, `Wallet/PromoRedeemTest.php`

| ID | Case | Precondition | Steps | Expected | Priority |
|---|---|---|---|---|---|
| WALL-BAL-001 | Get wallet balance | Authenticated learner with active profile | GET `wallet/balance` | 200, balance returned (new learner: 100 coin) | Critical |
| WALL-BAL-003 | Frontend header displays wallet balance | Authenticated, balance > 0 | Open dashboard or any _app route | Coin pill in header shows formatted balance | High |
| WALL-TOP-001 | List active top-up packages only | Active and inactive packages exist | GET `wallet/topup-packages` | 200, only active packages, sorted by display_order | High |
| WALL-TOP-002 | Frontend top-up dialog loads packages | Authenticated, packages exist | Click coin pill in header | TopUpDialog opens, package list displayed with price/coin/bonus info | High |
| WALL-PAY-001 | Create top-up order | Package exists, authenticated | POST `wallet/topup` with package_id, provider=payos | 201, order with status=pending, order_code, amount_vnd, coins_to_credit | Critical |
| WALL-PAY-002 | Confirm top-up credits coins | Pending order, payment callback or manual confirm | Simulate payment callback or TopupService.confirmByOrderCode | Order status → paid, coins credited to wallet, transaction created | Critical |
| WALL-PAY-004 | Frontend redirects to payment URL | Top-up order created with payment_url | Click payment action on selected package | Browser navigates to payment_url | Critical |
| WALL-PROMO-001 | Redeem valid promo code | Valid promo code exists, learner has active profile | POST `wallet/promo-redeem` with code | 200, coins granted, balance updated | Critical |
| WALL-PROMO-002 | Redeem invalid promo code | Code does not exist | POST promo redeem with invalid code | 422, error message, balance unchanged | High |
| WALL-PROMO-005 | Frontend promo redeem card on profile | Authenticated, profile page | Enter code in PromoRedeemCard, submit | On success: code cleared, success popup, balance invalidated | High |
| WALL-PROMO-006 | Frontend promo redeem field error | Invalid code submitted | Submit code | Field error displayed, success popup not shown | High |
