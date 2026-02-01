#!/bin/bash
# Ski Rainbow Launcher – always fetches the latest version before opening

REPO_DIR="$HOME/skirainbow"

# Clone if missing, otherwise pull latest
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Cloning Ski Rainbow..."
  git clone https://github.com/Jussabdrol/skirainbow.git "$REPO_DIR"
else
  echo "Updating Ski Rainbow..."
  cd "$REPO_DIR" && git pull origin main
fi

echo "Opening Ski Rainbow..."
open "$REPO_DIR/index.html"
