#!/usr/bin/env python3
"""
Build DOCX from Markdown while preserving FPT template formatting.
Workflow: MD -> Pandoc (styles) -> docxcompose merge with template -> Final DOCX

Usage:
    python scripts/build-docx.py
    python scripts/build-docx.py --md docs/capstone/report1.md --template templates/fpt.docx
"""

import subprocess
import tempfile
import argparse
from pathlib import Path

try:
    from docx import Document
    from docxcompose.composer import Composer
except ImportError:
    print("Missing dependencies. Run: pip install python-docx docxcompose")
    exit(1)


def build_docx(md_path: Path, template_path: Path, output_path: Path):
    """
    Convert MD to DOCX preserving template headers/footers/logos.
    
    1. Pandoc converts MD -> intermediate DOCX (for content + basic styles)
    2. docxcompose merges content into template (preserves header/footer)
    """
    
    # Step 1: Convert MD to intermediate DOCX via Pandoc
    with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as tmp:
        intermediate_path = tmp.name
    
    print(f"Step 1: Converting {md_path.name} via Pandoc...")
    subprocess.run([
        'pandoc', str(md_path),
        '-o', intermediate_path,
        '--from=markdown',
        '--to=docx'
    ], check=True)
    
    # Step 2: Open template and append content
    print(f"Step 2: Merging with template {template_path.name}...")
    
    # Load template (has headers, footers, logo)
    template_doc = Document(str(template_path))
    
    # Clear template body content (keep headers/footers)
    for element in template_doc.element.body[:]:
        template_doc.element.body.remove(element)
    
    # Use Composer to append content from intermediate docx
    composer = Composer(template_doc)
    content_doc = Document(intermediate_path)
    composer.append(content_doc)
    
    # Save final output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    composer.save(str(output_path))
    
    # Cleanup
    Path(intermediate_path).unlink()
    
    print(f"Done: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description='Build DOCX from Markdown with FPT template')
    parser.add_argument('--md', type=Path, 
                        default=Path('docs/capstone/report1-project-introduction.md'),
                        help='Input Markdown file')
    parser.add_argument('--template', type=Path,
                        default=Path('docs/capstone/templates/fpt-report1-template.docx'),
                        help='FPT template DOCX')
    parser.add_argument('--output', type=Path,
                        default=Path('docs/capstone/docx/Report1_Project-Introduction.docx'),
                        help='Output DOCX path')
    
    args = parser.parse_args()
    
    # Validate inputs
    if not args.md.exists():
        print(f"Error: MD file not found: {args.md}")
        exit(1)
    if not args.template.exists():
        print(f"Error: Template not found: {args.template}")
        exit(1)
    
    build_docx(args.md, args.template, args.output)


if __name__ == '__main__':
    main()
