# Capstone Document Workflow

## Nguyên tắc

- **MD = Source of Truth**: Viết và chỉnh sửa nội dung trong file `.md`
- **DOCX = Final Output**: Copy nội dung từ MD vào Word template khi cần nộp
- **Template giữ nguyên format**: Không thay đổi font, size, styles trong template

## Cấu trúc thư mục

```
docs/capstone/
├── report1-project-introduction.md    # Source (edit ở đây)
├── templates/
│   └── fpt-report1-template.docx      # Template gốc (không edit)
└── docx/
    └── Report1_Project-Introduction.docx  # Final output (copy từ MD)
```

## Workflow: MD → Word

### Bước 1: Edit MD
Mở và chỉnh sửa `docs/capstone/report1-project-introduction.md`

### Bước 2: Mở template
Mở `docs/capstone/templates/fpt-report1-template.docx` trong Word

### Bước 3: Copy content theo sections

| Section | Copy từ MD | Paste vào Word |
|---------|------------|----------------|
| 1.1 Project Information | Phần bullet list Project info | Thay thế `<<...>>` placeholders |
| 1.2 Project Team | Bảng team members | Thay thế sample rows trong table |
| 2. Product Background | Toàn bộ section 2 | Thay thế `<<Sample:...>>` |
| 3. Existing Systems | Các subsections 3.1-3.6 | Thay thế sample text |
| 4. Business Opportunity | Toàn bộ section 4 | Thay thế sample text |
| 5. Vision | Toàn bộ section 5 | Thay thế sample text |
| 6. Scope & Limitations | Features + Limitations | Thay thế sample text |

### Bước 4: Save As
Save As → `docs/capstone/docx/Report1_Project-Introduction.docx`

### Bước 5: Commit
```bash
git add docs/capstone/
git commit -m "Update Report 1 content"
```

## Tips

1. **Copy text only**: Khi paste, dùng "Paste Special → Unformatted Text" (Ctrl+Shift+V) để giữ format của template
2. **Tables**: Copy từng cell, không copy cả table
3. **Bullet points**: Paste text rồi apply bullet style của template
4. **Check trước khi nộp**: Verify font (Times New Roman 13pt), margins, header/footer
