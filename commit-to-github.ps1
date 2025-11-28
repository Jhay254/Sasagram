# Lifeline - Automated Git Commit & Push Script
# ============================================

param(
    [string]$CommitMessage = "",
    [string]$GitHubUsername = "",
    [string]$RepoName = "lifeline",
    [switch]$SkipPush
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lifeline Git Automation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to Lifeline directory
Set-Location "C:\Users\Administrator\Documents\Lifeline"

# Step 1: Check if Git is installed
Write-Host "[1/8] Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✓ Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed. Please install Git for Windows from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Step 2: Initialize Git repository if needed
Write-Host "`n[2/8] Checking Git repository..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "Initializing new Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✓ Git repository already exists" -ForegroundColor Green
}

# Step 3: Create/Update .gitignore
Write-Host "`n[3/8] Setting up .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Prisma
backend/prisma/migrations/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db
*.log

# IDEs
.vscode/
.idea/
*.swp
*.swo
*.sublime-*

# Build outputs
dist/
build/
.next/
out/

# Testing
coverage/

# Misc
.cache/
.temp/
.tmp/

# Brain artifacts (optional - uncomment to exclude from commits)
# .gemini/
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent -Force
Write-Host "✓ .gitignore created/updated" -ForegroundColor Green

# Step 4: Show status
Write-Host "`n[4/8] Git status:" -ForegroundColor Yellow
git status --short

# Step 5: Stage files
Write-Host "`n[5/8] Staging files..." -ForegroundColor Yellow
git add .

$stagedFiles = git diff --cached --name-only
$fileCount = ($stagedFiles | Measure-Object).Count
Write-Host "✓ Staged $fileCount files" -ForegroundColor Green

# Step 6: Get commit message
Write-Host "`n[6/8] Creating commit..." -ForegroundColor Yellow
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = @"
feat: Implement Phase 5 Advanced Features (feature-flagged)

- 5.1 Prediction Engine: LSTM forecasting, life event predictions
- 5.2 Audio Interrogator: Whisper AI voice diary with emotion detection
- 5.3 Before I Die Mode: Dead man's switch & posthumous content
- 5.4 Historical Archive: OCR bulk import with AI organization
- 5.5 API Licensing: Developer portal with usage tracking

Total: 5,600+ lines across 20 files
- 20 new database models (674 lines)
- 28 new API routes
- 5 mobile screens with COMING SOON states
- All features disabled by default via feature flags
"@
}

Write-Host "Commit message:" -ForegroundColor Cyan
Write-Host $CommitMessage -ForegroundColor Gray
Write-Host ""

# Commit
git commit -m $CommitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Commit failed. Check if there are changes to commit." -ForegroundColor Red
    exit 1
}

# Step 7: Set up remote
Write-Host "`n[7/8] Configuring GitHub remote..." -ForegroundColor Yellow

# Check if remote exists
$remoteUrl = git remote get-url origin 2>$null

if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
    # Need to add remote
    if ([string]::IsNullOrWhiteSpace($GitHubUsername)) {
        Write-Host "Enter your GitHub username:" -ForegroundColor Cyan -NoNewline
        $GitHubUsername = Read-Host " "
    }
    
    Write-Host "Enter repository name [default: lifeline]:" -ForegroundColor Cyan -NoNewline
    $inputRepoName = Read-Host " "
    if (-not [string]::IsNullOrWhiteSpace($inputRepoName)) {
        $RepoName = $inputRepoName
    }
    
    $remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
    
    Write-Host "`nAdding remote: $remoteUrl" -ForegroundColor Yellow
    git remote add origin $remoteUrl
    
    Write-Host "✓ Remote added" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Make sure you've created the repository on GitHub first!" -ForegroundColor Yellow
    Write-Host "Visit: https://github.com/new" -ForegroundColor Cyan
    Write-Host "Repository name: $RepoName" -ForegroundColor Cyan
    Write-Host ""
    
    $createNow = Read-Host "Have you created the repository on GitHub? (y/n)"
    if ($createNow -ne "y") {
        Write-Host "`nPlease create the repository first, then run this script again." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✓ Remote already configured: $remoteUrl" -ForegroundColor Green
}

# Ensure we're on main branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch to 'main'..." -ForegroundColor Yellow
    git branch -M main
}

# Step 8: Push to GitHub
if (-not $SkipPush) {
    Write-Host "`n[8/8] Pushing to GitHub..." -ForegroundColor Yellow
    Write-Host "This may take a moment for the first push..." -ForegroundColor Gray
    
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  SUCCESS! Code is now on GitHub" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "View your repository at:" -ForegroundColor Cyan
        Write-Host "$remoteUrl" -ForegroundColor White
    } else {
        Write-Host "✗ Push failed. You may need to:" -ForegroundColor Red
        Write-Host "  1. Authenticate with GitHub (use GitHub Desktop or gh auth login)" -ForegroundColor Yellow
        Write-Host "  2. Ensure the repository exists on GitHub" -ForegroundColor Yellow
        Write-Host "  3. Check your internet connection" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "`n[8/8] Skipping push (--SkipPush flag set)" -ForegroundColor Yellow
}

Write-Host "`nDone! 🎉" -ForegroundColor Green
