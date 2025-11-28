# How to Save Your Code to GitHub (Step-by-Step for Beginners)

## What is This About?

You've built amazing features for Lifeline. Now you need to save them online (like saving a Word document to Google Drive) so:
- ✅ Your code is backed up safely
- ✅ You can access it from anywhere
- ✅ Others can collaborate with you
- ✅ You have a history of all changes

**GitHub** is like Dropbox or Google Drive, but specifically designed for code.

---

## Before You Start - What You Need

### 1. A GitHub Account (Free)

**Do you have a GitHub account?**
- ✅ Yes → Go to Step 2
- ❌ No → Create one now:
  1. Go to https://github.com/signup
  2. Enter your email address
  3. Create a password
  4. Choose a username (like "john-smith")
  5. Click the "Create account" button
  6. Verify your email

### 2. Check if Git is Installed

**What is Git?** It's a tool that helps save your code with a history of changes (like "Track Changes" in Word, but better).

**To check if you have it:**
1. Click the Windows Start button (bottom-left of your screen)
2. Type: `PowerShell`
3. Click on "Windows PowerShell"
4. A blue/black window will appear - this is the "command window"
5. Type this and press Enter:
   ```
   git --version
   ```

**What happens:**
- ✅ If you see something like `git version 2.x.x` → You have Git! Go to next section
- ❌ If you see an error → You need to install Git (see instructions below)

**To Install Git (if needed):**
1. Go to https://git-scm.com/download/win
2. Download will start automatically
3. Once downloaded, double-click the file to install
4. Click "Next" on all screens (defaults are fine)
5. Restart your computer
6. Test again using the steps above

---

## The Easy Way - Using Our Automated Script

I've created a script that does everything automatically. Think of it as a "one-click backup button."

### Step 1: Create a Home for Your Code on GitHub

Before saving, you need to create a space on GitHub (like creating a new folder on Google Drive):

1. **Go to GitHub:**
   - Open your web browser
   - Go to https://github.com
   - Make sure you're logged in (you should see your profile picture in the top-right)

2. **Create a New Repository** (Repository = Project Folder):
   - Click the **+** button in the top-right corner
   - Click **"New repository"**
   
3. **Fill in the Details:**
   - **Repository name:** Type `lifeline` (no spaces)
   - **Description:** Type `My Lifeline AI Project`
   - **Who can see this?**
     - Choose **Private** if you want only you to see it (recommended)
     - Choose **Public** if you want everyone to see it
   - **Important:** Do NOT check any boxes (no README, no .gitignore, no license)
   - Click the green **"Create repository"** button at the bottom

4. **You'll see a page with instructions** - Don't worry about them! Just keep this page open. You'll need it in a moment.

### Step 2: Run the Automated Script

Now let's save your code automatically:

1. **Open PowerShell:**
   - Click the Windows Start button
   - Type: `PowerShell`
   - **Right-click** on "Windows PowerShell"
   - Click **"Run as administrator"** (this is important!)
   - If it asks "Do you want to allow this app to make changes?", click **Yes**

2. **Navigate to Your Lifeline Folder:**
   - In the PowerShell window, copy and paste this command, then press Enter:
   ```
   cd C:\Users\Administrator\Documents\Lifeline
   ```
   - You should now see your location changed to the Lifeline folder

3. **Enable Scripts** (One-Time Setup):
   - Copy and paste this command and press Enter:
   ```
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   - If it asks "Are you sure?", type `Y` and press Enter
   - This allows the script to run (you only need to do this once ever)

4. **Run the Magic Script:**
   - Copy and paste this command and press Enter:
   ```
   .\commit-to-github.ps1
   ```

5. **Follow the Prompts:**
   
   The script will ask you some questions:

   **"Enter your GitHub username:"**
   - Type your GitHub username (the one you created in Step 1)
   - Press Enter
   
   **"Enter repository name [default: lifeline]:"**
   - Just press Enter (it will use "lifeline" by default)
   
   **"Have you created the repository on GitHub? (y/n)"**
   - Type `y` and press Enter (because you created it in Step 1, Section 3)

6. **Wait for Upload:**
   - You'll see text scrolling - this is your code being uploaded
   - When you see "SUCCESS! Code is now on GitHub" with a green checkmark, you're done! 🎉

### Step 3: Verify Your Code is Online

1. Go back to your web browser
2. Go to https://github.com/YOUR-USERNAME/lifeline (replace YOUR-USERNAME with your actual username)
3. You should see all your files!

---

## What If Something Goes Wrong?

### "You need to authenticate"

This means GitHub needs to verify it's really you:

**Easiest Solution - Use GitHub Desktop:**
1. Download GitHub Desktop: https://desktop.github.com
2. Install it (double-click the downloaded file, click Next, Next, Install)
3. Open GitHub Desktop
4. Click "Sign in to GitHub.com"
5. Enter your GitHub username and password
6. Go back to PowerShell and run the script again: `.\commit-to-github.ps1`

### "Script won't run" or "Execution Policy" Error

You need to allow scripts to run:
1. Open PowerShell **as Administrator** (right-click → Run as administrator)
2. Run this command:
   ```
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Type `Y` and press Enter
4. Try the script again

### "Repository not found"

You forgot to create the repository on GitHub:
1. Go back to [Step 1](#step-1-create-a-home-for-your-code-on-github)
2. Create the repository
3. Then run the script again

### "Nothing to commit"

This means there are no new changes to save. This is okay! It means everything is already saved.

---

## Making Changes Later (Future Updates)

After your first upload, updating your code online is super easy:

### When You Make Changes to Your Code:

1. Open PowerShell
2. Navigate to Lifeline folder:
   ```
   cd C:\Users\Administrator\Documents\Lifeline
   ```
3. Run the script:
   ```
   .\commit-to-github.ps1
   ```
4. That's it! Your changes are now backed up online.

**Think of it like clicking "Save" in Word, but for your entire project.**

---

## Understanding What's Happening (Optional Reading)

When you run the script, here's what happens behind the scenes:

1. **Checking** - It checks what files have changed
2. **Staging** - It prepares all changed files to be saved
3. **Committing** - It creates a "snapshot" of your project (like taking a photo of your work)
4. **Pushing** - It uploads that snapshot to GitHub (like emailing the photo to yourself)

Each time you run the script, you create a new snapshot. GitHub keeps ALL snapshots forever, so you can always go back to previous versions if needed!

---

## Quick Reference Card

**Print this out and keep it handy:**

```
SAVING MY CODE TO GITHUB:

1. Open PowerShell as Administrator
2. Type: cd C:\Users\Administrator\Documents\Lifeline
3. Type: .\commit-to-github.ps1
4. Answer the questions
5. Done!

FIRST TIME ONLY:
- Create account at github.com/signup
- Create repository at github.com/new (name it "lifeline")
- Enable scripts: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Video Tutorial Suggestion

If you're a visual learner, search YouTube for:
- "GitHub for beginners"
- "How to use GitHub Desktop"
- "Git basics for non-programmers"

---

## Need More Help?

**If you get stuck:**
1. Take a screenshot of the error message
2. Google: "GitHub" + [the error message]
3. Or ask ChatGPT: "I'm trying to save my code to GitHub and got this error: [paste error]"

**Common Questions:**

**Q: Will I lose my code if I do this wrong?**
A: No! Your code stays on your computer. GitHub just makes a copy online.

**Q: Can I undo this?**
A: Yes! You can delete the repository on GitHub anytime.

**Q: How much does GitHub cost?**
A: Free for unlimited private repositories!

**Q: Do I need to do this every time I make changes?**
A: Only when you want to backup/save your changes online. Like hitting "Save" in Word - do it whenever you finish a meaningful amount of work.

---

**You've got this! Follow the steps slowly, one at a time, and you'll be fine.** 🚀
