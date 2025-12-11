# PostgreSQL Setup Guide

## 1. What are "Local Credentials"?
When you installed PostgreSQL, you created a "user" and a "password" that allows applications to access your database. These are your credentials.

### The 5 Key Pieces of Information:
1.  **Username**: Usually defaults to `postgres` (unless you changed it).
2.  **Password**: The password you typed during the installation setup. **This is the most important part.**
3.  **Host**: Since it's on your computer, this is `localhost`.
4.  **Port**: The default is `5432`.
5.  **Database Name**: The name of the specific database for this app. We'll call it `sasagram_db`.

---

## 2. Constructing Your Connection String
The application needs a single "URL" string that combines all these pieces. The format is:

```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE_NAME]
```

### Example
If your password is `mysecretpassword`, your string would look like this:

```
postgresql://postgres:mysecretpassword@localhost:5432/sasagram_db
```

---

## 3. How to Connect (Step-by-Step)

### Step A: Open the Environment File
1.  Go to VS Code.
2.  Open the file named `.env` inside the `backend` folder.

### Step B: Update the Variable
Find the line starting with `DATABASE_URL=`. It currently looks like a placeholder.

**Change it to match your credentials.**

*   **If you know your password:**
    Replace `sasagram_dev_password` with your actual password.
    
    *Current:*
    `DATABASE_URL="postgresql://sasagram:sasagram_dev_password@localhost:5432/sasagram_db"`
    
    *New (Example):*
    `DATABASE_URL="postgresql://postgres:MyRealPassword123@localhost:5432/sasagram_db"`

### Step C: Save the File
Press `Ctrl+S` to save the `.env` file.

---

## 4. Initializing the Database
Once the `.env` file is saved with the correct password, you need to tell the application to create the database tables.

Run this command in your terminal (inside the `backend` folder):

```bash
npx prisma migrate dev --name init_local_db
```

**What this does:**
1.  Connects to PostgreSQL using your password.
2.  Creates a new database named `sasagram_db`.
3.  Creates all the tables (Users, Posts, etc.) defined in our code.

---

## FAQ

**Q: I forgot my password!**
A: If you just installed it and can't remember, the easiest way is often to reinstall PostgreSQL or use the "pgAdmin" tool (which usually installs with PostgreSQL) to reset the `postgres` user password.

**Q: It says "Authentication failed"**
A: This means the password in your `.env` file doesn't match the one in PostgreSQL. Double-check for typos.

**Q: It says "Database does not exist"**
A: The `npx prisma migrate` command above will automatically create it for you.
