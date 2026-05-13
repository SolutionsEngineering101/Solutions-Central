#!/bin/bash
# setup.sh — Run this once after cloning the repo
# Usage: bash scripts/setup.sh

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Solutions Engineering — Repo Setup         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Check Claude Code is installed
if ! command -v claude &> /dev/null; then
  echo "❌ Claude Code not found."
  echo "   Install it: npm install -g @anthropic-ai/claude-code"
  echo "   Then re-run this script."
  exit 1
else
  echo "✅ Claude Code found: $(claude --version)"
fi

# 2. Check git config
GIT_NAME=$(git config --global user.name)
GIT_EMAIL=$(git config --global user.email)
if [ -z "$GIT_NAME" ] || [ -z "$GIT_EMAIL" ]; then
  echo ""
  echo "⚠️  Git identity not set. Let's fix that."
  read -p "   Your full name: " NAME
  read -p "   Your work email: " EMAIL
  git config --global user.name "$NAME"
  git config --global user.email "$EMAIL"
  echo "✅ Git identity set."
else
  echo "✅ Git identity: $GIT_NAME <$GIT_EMAIL>"
fi

# 3. Confirm member folder exists
echo ""
echo "📁 Checking your personal folder..."
read -p "   Enter your folder name (e.g. hemanga-bharadwaj): " FOLDER
if [ -d "team/$FOLDER" ]; then
  echo "✅ Found: team/$FOLDER"
else
  echo "⚠️  Folder team/$FOLDER not found."
  echo "   Creating from template..."
  cp -r team/_template "team/$FOLDER"
  git add "team/$FOLDER"
  git commit -m "onboard: add folder for $FOLDER"
  git push
  echo "✅ Created and pushed: team/$FOLDER"
fi

# 4. Done
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Setup complete!                         ║"
echo "║                                              ║"
echo "║   Quick commands:                            ║"
echo "║   claude \"log today's work for [name]\"       ║"
echo "║   claude \"process new solution form\"         ║"
echo "║   claude \"create new project [name]\"         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
