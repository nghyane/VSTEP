# Skill: Icon Patterns

## Bộ icon có sẵn (38 từ Duo DS)

Xem `src/assets/icons/`. Tên: `{name}-{size}.svg` (small/medium/large/xs).

## Khi cần icon mới

Tạo SVG theo style Duo DS:
- **ViewBox**: 20-30px (small), 34-44px (medium)
- **Fill**: 2-tone — base color + darker shade cho depth
- **Stroke**: dùng darker shade, `stroke-width="2"`, `stroke-linecap="round"`
- **Corners**: rounded, không sharp edges
- **Highlight**: 1 circle/ellipse nhỏ fill lighter shade (tạo chiều sâu)
- **Không outline-only**: Duo icons luôn filled, không dùng stroke-only style

## Ví dụ: pencil-small.svg (tự tạo cho Writing)

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="..." fill="#58CC02"/>           <!-- base shape, skill color -->
  <path d="..." stroke="#478700"/>          <!-- detail lines, darker -->
  <circle cx="18.5" cy="4.5" r="1.5" fill="#79D634"/>  <!-- highlight dot -->
</svg>
```

## Mapping icon → feature

| Feature | Icon file | Ghi chú |
|---|---|---|
| Home/Dashboard | house-small.svg | |
| Luyện tập | weights-small.svg | |
| Thi thử | target-small.svg | |
| Khóa học | monthly-challenge-medium.svg | |
| Hồ sơ | face-small.svg | |
| Xem thêm | more-small.svg | |
| Nghe | volume-small.svg | |
| Đọc | book-default.svg | fill đã đổi sang #7850C8 |
| Viết | pencil-small.svg | tự tạo |
| Nói | microphone-small.svg | |
| Streak | streak-{size}.svg | |
| Xu/Gem | gem-{size}.svg | |
| Timer | timer-{size}.svg | |
| Trophy | trophy-small.svg | |
| Check | check-small.svg | |
