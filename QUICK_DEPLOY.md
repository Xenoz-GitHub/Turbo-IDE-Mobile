# Quick Deployment Guide

## Step-by-Step Deployment Commands

Copy and paste these commands in order. All commands are ready to run.

---

## Option 1: Deploy with Vercel Only (Fastest)

If you just want to deploy to Vercel without GitHub:

```powershell
cd c:\Users\SuarezJ\Downloads\turbo-cpp-ide-mobile

# Login to Vercel (opens browser)
vercel login

# Deploy to production
vercel --prod
```

**That's it!** Your app will be live at https://turbo-ide.vercel.app

---

## Option 2: Push to GitHub + Deploy to Vercel (Recommended)

### Step 1: Install Git (if not installed)

Download and install from: https://git-scm.com/download/win

Then **restart your terminal** and continue below.

### Step 2: Push to GitHub

```powershell
cd c:\Users\SuarezJ\Downloads\turbo-cpp-ide-mobile

# Initialize Git repository
git init

# Configure Git user
git config user.name "Xenoz-GitHub"
git config user.email "your-email@example.com"

# Add all files
git add .

# Create commit
git commit -m "Initial release: Turbo C++ Mobile v1.0.0 with comprehensive security"

# Add GitHub remote
git remote add origin https://github.com/Xenoz-GitHub/Turbo-IDE-Mobile.git

# Rename branch to main
git branch -M main

# Push to GitHub (you'll need to authenticate)
git push -u origin main
```

**Note:** GitHub may ask for authentication. Use:
- Personal Access Token (recommended)
- GitHub Desktop
- VS Code Git extension

### Step 3: Deploy to Vercel

```powershell
# Login to Vercel (opens browser)
vercel login

# Deploy to production
vercel --prod
```

---

## Verification Commands

After deployment, verify everything works:

```powershell
# Check if website is live
curl https://turbo-ide.vercel.app/api/health

# Check PWA manifest
curl https://turbo-ide.vercel.app/manifest.webmanifest

# Check Digital Asset Links
curl https://turbo-ide.vercel.app/.well-known/assetlinks.json

# Check security headers
curl -I https://turbo-ide.vercel.app
```

---

## Troubleshooting

### "Git not recognized"
- Install Git from https://git-scm.com/download/win
- Restart terminal after installation

### "Vercel not recognized"
```powershell
npm install -g vercel
```

### GitHub Authentication Failed
Use one of these methods:
1. **Personal Access Token:** GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
2. **GitHub CLI:** Install from https://cli.github.com/
3. **GitHub Desktop:** Use the GUI application

### Vercel Login Timeout
- Make sure your default browser opens
- Complete authentication in browser
- Return to terminal (it will auto-continue)

---

## What Happens Next?

### After Vercel Deployment

1. **Automatic Deployments:** Every push to `main` branch auto-deploys
2. **Preview URLs:** Pull requests get preview deployments
3. **Analytics:** Enable in Vercel dashboard
4. **Custom Domain:** Add in Vercel project settings

### After GitHub Push

1. **Continuous Deployment:** Vercel watches your GitHub repo
2. **Version Control:** All changes tracked
3. **Collaboration:** Others can contribute
4. **Backup:** Code safely stored on GitHub

---

## Quick Reference

### Git Commands
```powershell
git status                  # Check status
git add .                   # Stage changes
git commit -m "message"     # Commit changes
git push                    # Push to GitHub
git pull                    # Pull from GitHub
```

### Vercel Commands
```powershell
vercel                      # Deploy preview
vercel --prod               # Deploy production
vercel ls                   # List deployments
vercel logs                 # View logs
vercel env ls               # List environment variables
```

### Build Commands
```powershell
npm run build               # Build for production
npm run dev                 # Start dev server
npm run lint                # Type check
npm run security:audit      # Security check
```

---

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Website loads at https://turbo-ide.vercel.app
- [ ] PWA installs on mobile
- [ ] API endpoints work
- [ ] Security headers present
- [ ] No console errors

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Git Docs:** https://git-scm.com/doc
- **Project Docs:** See README.md

---

**Ready to deploy?** Start with Option 1 (Vercel only) for fastest results!

**ENCRYPTED CREW © 2026**
