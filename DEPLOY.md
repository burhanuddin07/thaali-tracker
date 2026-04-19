# 🍱 Thaali Tracker — Deployment Guide

## ✅ What You'll Get
- A live URL like `https://thaali-tracker.up.railway.app`
- Works on **mobile, tablet, desktop**
- Anyone in the world can access it
- **Free** on Railway (enough for your use case)

---

## STEP 1 — Create a GitHub Account
1. Go to **https://github.com** → Sign Up
2. Verify your email

---

## STEP 2 — Install Git on Your PC
1. Go to **https://git-scm.com/download/win**
2. Download and install (keep all default options)
3. Restart your PC after installing

---

## STEP 3 — Upload Code to GitHub

Open **Command Prompt** (press Win+R, type `cmd`, press Enter)

```
cd C:\thaali-tracker
git init
git add .
git commit -m "Initial commit"
```

Now go to **https://github.com/new**
- Repository name: `thaali-tracker`
- Keep it **Public**
- Click **Create repository**

GitHub will show you commands. Run these in Command Prompt:
```
git remote add origin https://github.com/YOURNAME/thaali-tracker.git
git branch -M main
git push -u origin main
```

Replace `YOURNAME` with your actual GitHub username.

---

## STEP 4 — Deploy on Railway

1. Go to **https://railway.app**
2. Click **Login** → **Login with GitHub**
3. Click **New Project**
4. Click **Deploy from GitHub repo**
5. Select your `thaali-tracker` repo
6. Railway will start building automatically

### Add a Volume (so data is saved permanently):
7. Click on your deployed service
8. Click **Volumes** tab → **Add Volume**
9. Mount Path: `/data`
10. Click **Add**

### Set Environment Variable:
11. Click **Variables** tab
12. Add: `RAILWAY_VOLUME_MOUNT_PATH` = `/data`
13. Railway will redeploy automatically

---

## STEP 5 — Get Your Public URL

1. Click your service → **Settings** tab
2. Under **Networking** → click **Generate Domain**
3. You'll get a URL like: `https://thaali-tracker-production.up.railway.app`

**Share this URL with everyone — works on mobile too! 📱**

---

## STEP 6 — First Time Setup on Live App

1. Open your Railway URL
2. Go to **Upload Excel** → upload your `.xlsx` file
3. Start marking stickers!

---

## 📱 Mobile Usage
- Open the URL in any mobile browser (Chrome, Safari)
- Navigation moves to the **bottom of screen** on mobile
- Works great on Android and iPhone

---

## 🔄 How to Update Code Later

If you make changes to the code:
```
cd C:\thaali-tracker
git add .
git commit -m "update"
git push
```
Railway will automatically redeploy in ~2 minutes.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Build failed on Railway | Check the Logs tab for errors |
| Data lost after redeploy | Make sure Volume is attached at /data |
| URL not working | Wait 2-3 min for first deploy to complete |
| Can't push to GitHub | Run `git config --global user.email "you@email.com"` first |

---

## 💰 Cost
- Railway **free tier**: $5 free credit/month — more than enough for this app
- No credit card required to start
