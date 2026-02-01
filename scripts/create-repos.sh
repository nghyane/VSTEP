#!/bin/bash

# VSTEP Repository Setup Script
# This script creates 3 GitHub repositories and sets up initial structure

set -e

GITHUB_USER="nghyane"
REPOS=("vstep-backend" "vstep-frontend" "vstep-grading")

echo "🔧 VSTEP Repository Setup"
echo "========================="
echo ""

# Function to create a repository
create_repo() {
    local repo_name=$1
    local local_path="/Users/nghiahoang/Dev/VSTEP/temp-$repo_name"
    local description=$2

    echo "📦 Creating $repo_name..."

    # Create local directory
    mkdir -p "$local_path"
    cd "$local_path"

    # Create GitHub repo using API
    curl -X POST -H "Authorization: token $(cat ~/.config/gh/hosts/github.com/api 2>/dev/null | grep -oP '(?<=oauth_token: ).*' || echo 'YOUR_TOKEN_HERE')" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$repo_name\",\"description\":\"$description\",\"private\":true}" \
        2>/dev/null || echo "Repo might already exist or using different auth"

    # Initialize git
    git init
    git branch -M main

    # Create initial files
    touch .gitignore
    touch README.md
    git add .
    git commit -m "Initial commit"
    git remote add origin "https://github.com/$GITHUB_USER/$repo_name.git"
    git push -u origin main

    echo "✅ $repo_name created and pushed!"
    echo ""
}

# Create each repository
create_repo "vstep-backend" "VSTEP Backend API - Bun + Elysia"
create_repo "vstep-frontend" "VSTEP Frontend - Bun + Vite + React"
create_repo "vstep-grading" "VSTEP Grading Service - Python + FastAPI + Celery"

echo "🎉 All repositories created successfully!"
