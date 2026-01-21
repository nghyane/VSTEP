#!/usr/bin/env python3
"""
MD to DOCX Builder - Uses template styles only.
"""

from docx import Document
from docx.shared import Pt
from docx.oxml.ns import nsdecls
from docx.oxml import parse_xml
from pathlib import Path
import re


def set_cell_shading(cell, color):
    """Set cell background color."""
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

# Style mapping - template style names
STYLE_MAP = {
    1: "Heading 1",
    2: "Heading 2", 
    3: "Heading 3",
    "normal": "Normal",
    "bullet": "List Paragraph",
    "number": "List Paragraph",
    "table": "Table Grid",
    "table_head": "Table Head",
    "table_body": "Table Text small",
}

# Fallbacks if style not in template
STYLE_FALLBACK = {
    "List Paragraph": "Normal",
    "Normal Table": None,
    "Table Head": "Normal",
    "Table Text small": "Normal",
}

def get_style(doc, style_key):
    """Get style name, falling back if not available."""
    style_name = STYLE_MAP.get(style_key, "Normal")
    style_names = {s.name for s in doc.styles}
    if style_name in style_names:
        return style_name
    return STYLE_FALLBACK.get(style_name, "Normal")

def parse_md(md_text):
    """Parse markdown into structured blocks.
    
    Skips content before the first heading (cover page metadata).
    """
    blocks = []
    lines = md_text.split('\n')
    i = 0
    found_first_heading = False
    
    while i < len(lines):
        line = lines[i]
        
        # Skip content before first heading (cover page in MD)
        if not found_first_heading:
            if line.startswith('# '):
                found_first_heading = True
            else:
                i += 1
                continue
        
        # Headings
        if line.startswith('# '):
            blocks.append(('heading', 1, line[2:].strip()))
        elif line.startswith('## '):
            blocks.append(('heading', 2, line[3:].strip()))
        elif line.startswith('### '):
            blocks.append(('heading', 3, line[4:].strip()))
        
        # Bullet list
        elif line.startswith('- ') or line.startswith('* '):
            blocks.append(('bullet', line[2:].strip()))
        
        # Numbered list
        elif re.match(r'^\d+\. ', line):
            blocks.append(('number', re.sub(r'^\d+\. ', '', line).strip()))
        
        # Table
        elif line.startswith('|'):
            table_lines = []
            while i < len(lines) and lines[i].startswith('|'):
                if not lines[i].startswith('|--') and not lines[i].startswith('| --'):
                    table_lines.append(lines[i])
                i += 1
            i -= 1
            blocks.append(('table', parse_table(table_lines)))
        
        # Normal paragraph
        elif line.strip():
            blocks.append(('paragraph', line.strip()))
        
        i += 1
    
    return blocks

def parse_table(lines):
    """Parse markdown table lines into 2D array."""
    rows = []
    for line in lines:
        cells = [c.strip() for c in line.split('|')[1:-1]]
        if cells:
            rows.append(cells)
    return rows

def render_inline(paragraph, text):
    """Render inline formatting (bold, italic) within a paragraph."""
    # Split by bold markers
    parts = re.split(r'(\*\*.*?\*\*)', text)
    
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part:
            # Handle italic within non-bold parts
            italic_parts = re.split(r'(\*.*?\*)', part)
            for ip in italic_parts:
                if ip.startswith('*') and ip.endswith('*') and not ip.startswith('**'):
                    run = paragraph.add_run(ip[1:-1])
                    run.italic = True
                elif ip:
                    paragraph.add_run(ip)

def find_content_start_index(doc):
    """Find where content should start (after cover/TOC).
    
    Returns the index AFTER TOC section ends.
    Strategy:
    1. Look for existing content markers ("I. Record of Changes", etc.)
    2. If not found, look for end of TOC section (after "Table of Contents" heading)
    3. If TOC found, return index after TOC instructions
    """
    # First, look for existing content section markers
    content_markers = [
        "I. Record of Changes",
        "Record of Changes", 
        "I.",  # Any section starting with Roman numeral I.
    ]
    
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        for marker in content_markers:
            if text.startswith(marker):
                return i
    
    # If no content marker, find end of TOC section
    # Look for "Table of Contents" heading, then find last TOC-related paragraph
    toc_index = -1
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if "Table of Contents" in text:
            toc_index = i
            break
    
    if toc_index >= 0:
        # Find the last paragraph that's part of TOC (instructions, etc.)
        # Look for paragraphs after TOC that contain TOC-related text
        last_toc_para = toc_index
        for i in range(toc_index + 1, len(doc.paragraphs)):
            text = doc.paragraphs[i].text.strip()
            if text and ("TOC" in text or "Table of Contents" in text or 
                        "Insert Table" in text or "Update Field" in text):
                last_toc_para = i
            elif text and not text.startswith("("):
                # Found a non-empty, non-instruction paragraph
                break
        
        # Return index after last TOC paragraph
        return last_toc_para + 1
    
    # If nothing found, return -1 (append at end)
    return -1

def clear_content_after_toc(doc, start_index):
    """Remove all body content from start_index onwards.
    
    This clears paragraphs and tables after the TOC section,
    preserving cover page, TOC, and section properties (page layout).
    """
    if start_index < 0:
        return  # No marker found, don't clear anything
    
    # Get the body element (parent of paragraphs)
    body = doc.element.body
    
    if start_index >= len(doc.paragraphs):
        return
    
    # Get the XML element of the paragraph at start_index
    start_para_element = doc.paragraphs[start_index]._element
    
    # Find all elements after this paragraph and remove them
    # BUT preserve sectPr (section properties) which contains page layout
    from docx.oxml.ns import qn
    SECT_PR_TAG = qn('w:sectPr')
    
    found_start = False
    elements_to_remove = []
    
    for element in body:
        if element == start_para_element:
            found_start = True
            # Include this element too (it will be re-added from MD)
            elements_to_remove.append(element)
        elif found_start:
            # Don't remove section properties
            if element.tag != SECT_PR_TAG:
                elements_to_remove.append(element)
    
    for element in elements_to_remove:
        body.remove(element)

def build_docx(md_path, template_path, output_path):
    """Build DOCX from MD using template styles.
    
    Preserves cover page and TOC from template, only adds/replaces content after.
    """
    
    # Load template
    doc = Document(str(template_path))
    
    # Validate required styles exist
    style_names = [s.name for s in doc.styles]
    for level, style_name in STYLE_MAP.items():
        if style_name not in style_names:
            print(f"Warning: Style '{style_name}' not found in template")
    
    # Parse markdown
    md_text = Path(md_path).read_text(encoding='utf-8')
    blocks = parse_md(md_text)
    
    # Find where content should start (after cover/TOC)
    content_start = find_content_start_index(doc)
    
    if content_start >= 0 and content_start < len(doc.paragraphs):
        para_text = doc.paragraphs[content_start].text.strip()
        if para_text:
            print(f"📍 Found content at paragraph {content_start}: '{para_text[:50]}...'")
        else:
            print(f"📍 Content area starts at paragraph {content_start} (after TOC)")
        # Clear existing content after TOC (if any sample content exists)
        clear_content_after_toc(doc, content_start)
    elif content_start >= len(doc.paragraphs):
        print(f"📍 TOC ends at paragraph {content_start - 1}, appending content after")
    else:
        print("📍 No TOC marker found, appending at end of template")
    
    # Now add content from markdown
    for block in blocks:
        block_type = block[0]
        
        if block_type == 'heading':
            level = block[1]
            text = block[2]
            style_name = get_style(doc, level)
            p = doc.add_paragraph(style=style_name)
            render_inline(p, text)
            
        elif block_type == 'paragraph':
            text = block[1]
            p = doc.add_paragraph(style=get_style(doc, "normal"))
            render_inline(p, text)
            
        elif block_type == 'bullet':
            text = block[1]
            style_name = get_style(doc, "bullet")
            p = doc.add_paragraph(style=style_name)
            # Add bullet prefix if falling back to Normal (no list style)
            if style_name == "Normal":
                p.paragraph_format.left_indent = Pt(18)
                p.add_run("• ")
            render_inline(p, text)
            
        elif block_type == 'number':
            text = block[1]
            p = doc.add_paragraph(style=get_style(doc, "number"))
            render_inline(p, text)
            
        elif block_type == 'table':
            rows = block[1]
            if rows:
                table = doc.add_table(rows=len(rows), cols=len(rows[0]))
                table_style = get_style(doc, "table")
                if table_style:
                    try:
                        table.style = table_style
                    except:
                        pass  # Style may not exist
                
                # Get cell styles
                head_style = get_style(doc, "table_head")
                body_style = get_style(doc, "table_body")
                
                for i, row in enumerate(rows):
                    for j, cell_text in enumerate(row):
                        cell = table.cell(i, j)
                        cell.text = ""
                        p = cell.paragraphs[0]
                        # Apply "Table Head" to first row, "Table Text small" to others
                        cell_style = head_style if i == 0 else body_style
                        if cell_style:
                            try:
                                p.style = cell_style
                            except:
                                pass
                        # Apply background color to header row
                        if i == 0:
                            set_cell_shading(cell, "FFE8E1")  # Light pink header
                        # Render text
                        render_inline(p, cell_text)
                        # Force font and bold for table cells (runs don't inherit from paragraph style)
                        for run in p.runs:
                            if i == 0:
                                # Header: Arial 11pt Bold
                                run.font.name = "Arial"
                                run.font.size = Pt(11)
                                run.bold = True
                            else:
                                # Body: Arial 9pt
                                run.font.name = "Arial"
                                run.font.size = Pt(9)
    
    # Save
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(output_path))
    print(f"✅ Created: {output_path}")

def main():
    import sys
    
    project_root = Path(__file__).parent.parent
    template = project_root / "docs/capstone/templates/fpt-report1-template.docx"
    
    if len(sys.argv) > 1:
        md_path = Path(sys.argv[1])
        if not md_path.exists():
            # Try relative to capstone
            md_path = project_root / "docs/capstone" / f"{sys.argv[1]}.md"
    else:
        md_path = project_root / "docs/capstone/report1-project-introduction.md"
    
    output = project_root / "docs/capstone/docx" / f"{md_path.stem}.docx"
    
    if not md_path.exists():
        print(f"❌ File not found: {md_path}")
        sys.exit(1)
    
    build_docx(md_path, template, output)

if __name__ == "__main__":
    main()
