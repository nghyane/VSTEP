# [Mobile] Learning path endpoint — lộ trình học cá nhân (SRS FE-10)

**Labels:** `app:backend`, `app:mobile`, `type:feature`, `priority:medium`

---

## Mô tả

SRS FE-10 (§3.11.1) yêu cầu endpoint tạo **lộ trình học cá nhân hóa** theo tuần. Backend hiện không có endpoint hay logic nào cho tính năng này.

### SRS yêu cầu (§3.11.1)

```
GET /api/progress/learning-path    🔒 Auth required
```

**Processing:**
1. Xác định `weakestSkill` = skill có `windowAvg` thấp nhất
2. Nếu 2 skills chênh ≤ 0.3 → ưu tiên cả hai
3. Phân bổ tối thiểu 1 session/tuần mỗi skill
4. Sessions còn lại phân bổ tỷ lệ theo `gapToTarget`
5. Writing/Speaking → ưu tiên criteria yếu nhất
6. Listening/Reading → ưu tiên question types sai nhiều nhất

**Response:**
```json
{
  "weeklyPlan": [
    {
      "skill": "writing",
      "sessionsPerWeek": 3,
      "focusArea": "Coherence & Cohesion",
      "recommendedLevel": "B1",
      "estimatedMinutes": 45
    }
  ],
  "totalMinutesPerWeek": 180,
  "projectedImprovement": "B1 → B2 trong 8 tuần"
}
```

### Hiện trạng

- `progress/` module chỉ có: overview, bySkill, spiderChart, goals CRUD
- Không có route `/learning-path` hay function tạo plan
- Các building blocks đã có: `windowAvg`, `computeEta`, `gapToTarget` trong `overview.ts` và `trends.ts`

### Ảnh hưởng
- Mobile: thêm màn hình "Lộ trình học tập" hoặc tích hợp vào Home
- Frontend: tương tự

### Tham chiếu SRS
- FE-10 §3.11.1
