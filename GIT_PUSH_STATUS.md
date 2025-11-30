# 🚀 How to Push Your Code to GitHub

Since I cannot access your personal GitHub account, you need to manually "push" (upload) the code we've written. Follow these simple steps.

## Step 1: Open the Terminal

You need to type a command into the "Terminal" window in VS Code.

1.  Look at the bottom of your VS Code window. You should see a panel with tabs like "Problems", "Output", "Debug Console", and **"Terminal"**.
2.  Click on **"Terminal"**.
3.  If you don't see it, go to the top menu bar, click **"Terminal"** -> **"New Terminal"**.

## Step 2: Get Your GitHub Password (Personal Access Token)

GitHub no longer accepts your regular account password for security reasons. You need to generate a special "Personal Access Token" (PAT) to use as your password.

1.  **Log in to GitHub** in your web browser.
2.  Click your **profile picture** in the top-right corner and select **"Settings"**.
3.  Scroll down to the bottom of the left sidebar and click **"Developer settings"**.
4.  In the left sidebar, click **"Personal access tokens"** -> **"Tokens (classic)"**.
5.  Click the **"Generate new token"** button (select "Generate new token (classic)").
6.  **Note**: Give it a name like "Lifeline Project".
7.  **Expiration**: Choose "No expiration" (or 30 days if you prefer).
8.  **Select scopes**: Check the box next to **`repo`** (this gives full control of private repositories).
9.  Scroll down and click **"Generate token"**.
10. **COPY THE TOKEN IMMEDIATELY**. It looks like a long string of random characters (e.g., `ghp_...`). You won't be able to see it again!

## Step 3: Run the Command

Now, go back to VS Code and the **Terminal** you opened in Step 1.

1.  Type the following command and press **Enter**:

    ```bash
    git push -u origin main
    ```

2.  **Enter your Username**: It will ask for your GitHub username (which is `Jhay254`). Type it and press **Enter**.
3.  **Enter your Password**: It will ask for your password. **Paste the Personal Access Token (PAT)** you copied in Step 2.
    *   *Note: When you paste the token, you might NOT see any characters appear on the screen. This is normal security behavior. Just paste it and press **Enter**.*

## ✅ Success!

If successful, you will see a message saying `Branch 'main' set up to track remote branch 'main' from 'origin'`. This means your code is now safely on GitHub!
