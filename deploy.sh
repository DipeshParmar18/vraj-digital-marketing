#!/bin/bash
# ============================================
# Vraj Digital Marketing - Auto Deploy Script
# Run this ONCE and everything goes live!
# ============================================

GITHUB_TOKEN="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"
GITHUB_USERNAME=""  # Will be detected automatically
REPO_NAME="vraj-digital-marketing"
VERCEL_TOKEN=""     # Add your Vercel token here

echo "🚀 Vraj Digital Marketing — Auto Deploy"
echo "========================================"

# Step 1: Get GitHub username
echo "📡 Getting GitHub user info..."
GITHUB_USERNAME=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | grep '"login"' | head -1 | cut -d'"' -f4)

if [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ GitHub token invalid. Please check your token."
  exit 1
fi
echo "✅ GitHub user: $GITHUB_USERNAME"

# Step 2: Create GitHub repo
echo "📦 Creating GitHub repository..."
REPO_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Vraj Digital Marketing Suite — Complete Agency Tool\",\"private\":false,\"auto_init\":false}")

REPO_URL=$(echo $REPO_RESPONSE | grep '"clone_url"' | head -1 | cut -d'"' -f4)

if [ -z "$REPO_URL" ]; then
  echo "⚠️  Repo might already exist, trying to use existing..."
  REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi
echo "✅ Repo: $REPO_URL"

# Step 3: Git push
echo "📤 Pushing code to GitHub..."
cd "$(dirname "$0")"
git init
git add -A
git commit -m "🚀 Initial commit: Vraj Digital Marketing Suite - All 20 modules"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git push -u origin main --force

echo "✅ Code pushed to GitHub!"
echo "🔗 GitHub: https://github.com/$GITHUB_USERNAME/$REPO_NAME"

# Step 4: Deploy to Vercel (if token provided)
if [ -n "$VERCEL_TOKEN" ]; then
  echo "🌐 Deploying to Vercel..."
  npm install -g vercel 2>/dev/null

  # Create vercel.json
  cat > vercel.json << VEOF
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://lxbhictwtdntyqfgcntv.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmhpY3R3dGRudHlxZmdjbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTk4MDEsImV4cCI6MjA5NDQ5NTgwMX0.Zhy26Z-9v5lqYqL0FmhrAsiMa8ZKlQpQjOljZx-q3vc"
  }
}
VEOF

  vercel --token=$VERCEL_TOKEN --yes --prod
  echo "✅ Deployed to Vercel!"
else
  echo ""
  echo "⚠️  No Vercel token provided. To deploy to Vercel:"
  echo "   1. Go to vercel.com → Import Project"
  echo "   2. Import: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
  echo "   3. Add environment variables from .env.local"
  echo "   4. Click Deploy!"
fi

echo ""
echo "🎉 DONE! Your Vraj Digital Marketing tool is ready!"
echo "========================================"
echo "GitHub: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
