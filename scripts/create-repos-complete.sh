#!/bin/bash

# =============================================================================
# VSTEP Repository Setup Script
# Creates 3 GitHub repositories and initializes with proper structure
# =============================================================================

set -e

GITHUB_USER="nghyane"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"  # Set your token via env or edit below

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# REPOSITORY CONFIGURATIONS
# =============================================================================
declare -A REPO_CONFIGS
REPO_CONFIGS["vstep-backend"]="Bun + Elysia API for VSTEP Adaptive Learning System"
REPO_CONFIGS["vstep-frontend"]="Bun + Vite + React for VSTEP Adaptive Learning System"
REPO_CONFIGS["vstep-grading"]="Python + FastAPI + Celery AI Grading Service"

# =============================================================================
# MAIN SETUP
# =============================================================================

main() {
    echo "========================================"
    echo "  VSTEP Repository Setup"
    echo "========================================"
    echo ""

    # Check for GitHub token
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warn "GITHUB_TOKEN not set. You'll need to create repos manually or provide a token."
        echo ""
        echo "To create repos automatically, set the token:"
        echo "  export GITHUB_TOKEN=your_github_token"
        echo ""
        echo "Or create repos manually at:"
        echo "  - https://github.com/new (create all 3 repos first)"
        echo ""
    fi

    # Create each repository
    for repo in "${!REPO_CONFIGS[@]}"; do
        create_repository "$repo" "${REPO_CONFIGS[$repo]}"
    done

    echo ""
    log_info "All repositories created successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Add submodules to main repo: git submodule add <repo_url>"
    echo "  2. Update .gitmodules and commit"
}

# =============================================================================
# CREATE REPOSITORY FUNCTION
# =============================================================================

create_repository() {
    local repo_name=$1
    local description=$2
    local local_path="/Users/nghiahoang/Dev/VSTEP/temp-$repo_name"
    local remote_url="https://github.com/$GITHUB_USER/$repo_name.git"

    log_info "Setting up $repo_name..."

    # Step 1: Create GitHub repository via API (if token available)
    if [ -n "$GITHUB_TOKEN" ]; then
        log_info "Creating GitHub repository via API..."
        response=$(curl -s -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/user/repos \
            -d "{\"name\":\"$repo_name\",\"description\":\"$description\",\"private\":true}")

        if echo "$response" | grep -q '"id"'; then
            log_info "GitHub repository created!"
        else
            log_warn "Repository might already exist or API error: $(echo "$response" | grep -o '"message":"[^"]*"' | head -1)"
        fi
    else
        log_warn "Skipping GitHub repo creation (no token). Create manually at:"
        log_warn "  https://github.com/new?name=$repo_name"
    fi

    # Step 2: Create local repository structure
    log_info "Creating local structure..."
    rm -rf "$local_path"
    mkdir -p "$local_path/src"

    # Create README
    cat > "$local_path/README.md" << README_EOF
# ${repo_name}

${description}

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
bun install  # or pip install -r requirements.txt for Python

# Start development server
bun run dev  # or uvicorn app.main:app --reload
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── routes/          # API endpoints / Page components
├── middleware/      # Custom middleware
├── models/          # Data models & types
├── services/        # Business logic
└── utils/           # Helper functions
\`\`\`

## 🔧 Tech Stack

- **Runtime**: ${repo_name#vstep-}
- **Framework**: See package.json/requirements.txt

## 📝 Environment Variables

\`\`\`
DATABASE_URL=
API_KEY=
\`\`\`

---

*Part of VSTEP Adaptive Learning System*
README_EOF

    # Create .gitignore
    cat > "$local_path/.gitignore" << GITIGNORE_EOF
# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
.venv/

# Build outputs
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Misc
*.local
GITIGNORE_EOF

    # Step 3: Initialize git and push
    cd "$local_path"
    git init
    git branch -M main

    # Create initial commit
    git add .
    git commit -m "Initial commit: $(echo $repo_name | tr '-' ' ' | title)"

    # Add remote and push
    if [ -n "$GITHUB_TOKEN" ]; then
        git remote add origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/$GITHUB_USER/$repo_name.git"
        git push -u origin main
    else
        git remote add origin "https://github.com/$GITHUB_USER/$repo_name.git"
        log_info "Remote added. Push manually with:"
        log_info "  cd $local_path && git push -u origin main"
    fi

    log_info "$repo_name setup complete!"
    echo ""
}

# Run main function
main "$@"
