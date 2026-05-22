# Gamification UI Patterns

Phong cách Duolingo-ish cho component có yếu tố thưởng/đếm/feedback. Áp dụng khi thiết kế element liên quan tới xu, streak, thông báo, popup thành công.

## Nguyên tắc chung

- **Đáy dày 4px** (`border-b-4`) cho card/chip/button — tạo cảm giác "khối", có thể bấm.
- **Tint background + border tint** cho chip thay vì solid color → dễ đọc, không chói.
- **Vòng tròn icon container** kích thước cố định (size-9, size-10, size-12) với border-2 — tách icon khỏi text.
- **Gradient header** `from-{color}-tint/50 to-transparent` cho card có "khu vực giới thiệu" (profile, popup intro).
- **Uppercase tracked eyebrow** (`text-[11px] font-extrabold uppercase tracking-[0.18em]`) trên headline lớn — hierarchy rõ ràng.
- **Animation key:** dùng pulse ring + coin burst + coinPinch khi thưởng; dùng `popIn` cubic-bezier(0.34,1.56,0.64,1) cho overshoot nhẹ.

## Coin / Streak chip (Header)

Token: `bg-coin-tint border-2 border-coin/40 border-b-4`. Hover: `hover:bg-coin/25 hover:-translate-y-0.5 active:translate-y-0 active:border-b-2`.
Trigger animation 1 lần (không lặp khi remount) → dùng `useRef(pulse)` so sánh, chỉ chạy khi pulse khác last seen.

## Success popup

Bố cục:
1. **Banner trên** (gradient tint) — eyebrow + headline lớn + subtitle. Không icon ở đây để text căn đối xứng.
2. **Body** — icon lớn (size-32+) ở giữa, có pulse ring + coin burst + tilted "+N" badge ở góc.
3. **Stat tile** dashed border (`border-2 border-dashed`) hiển thị số liệu sau action.
4. **CTA** full-width primary, uppercase tracked.

File: [`features/wallet/TopUpSuccessPopup.tsx`](../../src/features/wallet/TopUpSuccessPopup.tsx).

## Dropdown / Menu item

- Wrapper: `border-2 border-border border-b-4 shadow-lg rounded-(--radius-banner)` — dày, có shadow.
- Profile header: gradient tint, avatar với border + shadow `shadow-[0_2px_0_var(--color-primary-dark)]`.
- Mỗi menu item: icon trong vòng tròn `size-9 border-2`, label `font-extrabold`, optional trailing badge.
- Destructive (logout): `text-destructive` + `bg-destructive-tint border-destructive/20`.
- Group hover trên icon container đổi `border-primary/30 text-primary` để feedback rõ.

File: [`components/ProfileDropdown.tsx`](../../src/components/ProfileDropdown.tsx).

## Notification item

- Icon trong vòng tròn `size-10` với tint theo loại: `coin → bg-coin-tint`, `streak → bg-streak-tint`, `trophy → bg-warning-tint`, `target → bg-primary-tint`.
- Unread: `bg-primary-tint/40 hover:bg-primary-tint/70`, title `font-extrabold`, dot bên phải `bg-primary ring-2 ring-primary/30`.
- Read: transparent, title `font-bold text-muted`, không dot.
- Empty state: mascot 80px + headline extrabold + subtle subtitle.

## Coin gain animation (cross-component)

- Store: [`lib/coin-gain.ts`](../../src/lib/coin-gain.ts) — `pulse` counter + `amount`.
- Trigger: `useCoinGain.getState().trigger(amount)` sau khi user đóng success popup (delay ~220ms để popup fade out).
- Listener (Header): `useRef(initialPulse)` so sánh để skip remount, set `animKey` → render fly-up "+N" + pulse ring.
- Keyframes mới trong `styles.css`: `coinFlyUp`, `coinPulseRing`, `sparkleSpin` (giữ `coinBurst` cũ).

## Anti-patterns

- ❌ Toast cho thành công nạp xu — không đủ celebratory, user dễ miss.
- ❌ Animation header chạy mỗi lần route remount — phải track last-seen pulse qua useRef.
- ❌ Trigger header animation lúc popup còn mở — bị che, user không thấy.
- ❌ Icon emoji 🎉 cạnh headline — phá symmetry, conflict với coin burst.
