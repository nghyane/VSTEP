# [Mobile] Goal response thiếu computed fields: achieved, onTrack, daysRemaining (SRS FE-11)

**Labels:** `app:backend`, `app:mobile`, `type:bug`, `priority:medium`

---

## Mô tả

SRS FE-11 (§3.12.2) yêu cầu goal response phải bao gồm **3 computed fields**: `achieved`, `onTrack`, `daysRemaining`. Backend hiện trả raw DB row mà không tính toán gì.

### SRS yêu cầu (§3.12.2)

```json
{
  "targetBand": "B2",
  "deadline": "2026-09-01",
  "dailyStudyTimeMinutes": 30,
  "achieved": false,
  "onTrack": true,
  "daysRemaining": 181
}
```

**Status computation:**
- `achieved`: true nếu `currentEstimatedBand >= targetBand`
- `onTrack`: true nếu ETA ≤ deadline
- `daysRemaining`: deadline − now (ngày)

### Hiện trạng

- `goals.ts#latest()` chỉ return raw DB row: `{ id, userId, targetBand, currentEstimatedBand, deadline, dailyStudyTimeMinutes, createdAt, updatedAt }`
- Không tính `achieved`, `onTrack`, hay `daysRemaining`
- Logic ETA **đã có** trong `overview.ts` (`computeEta`) nhưng không áp dụng cho goal
- Mobile Home hiển thị goal card nhưng chỉ show raw data, không biết user đã đạt hay chưa

### Đề xuất

Enrichment đơn giản trong `overview()` hoặc tạo helper:

```typescript
function enrichGoal(goal, skills, scores) {
  const currentBand = deriveOverallBand(skills);
  const eta = computeOverallEta(scores, goal.targetBand);
  const daysRemaining = goal.deadline 
    ? Math.ceil((new Date(goal.deadline) - Date.now()) / 86400000) 
    : null;
  return {
    ...goal,
    achieved: bandToNumber(currentBand) >= bandToNumber(goal.targetBand),
    onTrack: eta !== null && daysRemaining !== null ? eta * 7 <= daysRemaining : null,
    daysRemaining,
  };
}
```

### Effort: Nhỏ
Tất cả building blocks đã có. Chỉ cần compose trong response.

### Tham chiếu SRS
- FE-11 §3.12.2
