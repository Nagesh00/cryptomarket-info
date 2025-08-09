# 🚀 Deployment Guide

## Option 1: Heroku Deployment (Recommended)

### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed

### Steps:
1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-crypto-monitor
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set COINMARKETCAP_API_KEY=your_key
   heroku config:set COINGECKO_API_KEY=your_key
   heroku config:set GITHUB_TOKEN=your_token
   heroku config:set TELEGRAM_BOT_TOKEN=your_token
   heroku config:set TELEGRAM_CHAT_ID=your_chat_id
   heroku config:set EMAIL_USER=your_email
   heroku config:set EMAIL_PASS=your_password
   heroku config:set PRICE_CHANGE_THRESHOLD=5
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Open Your App**
   ```bash
   heroku open
   ```

### Your app will be available at: `https://your-crypto-monitor.herokuapp.com`

---

## Option 2: Railway Deployment

### Steps:
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub account
3. Select your `cryptomarket-info` repository
4. Railway will auto-deploy from your GitHub repo
5. Add environment variables in the Railway dashboard
6. Your app will be live at the provided Railway URL

---

## Option 3: Render Deployment

### Steps:
1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Create a new "Web Service"
4. Select your `cryptomarket-info` repository
5. Render will use the `render.yaml` configuration
6. Add environment variables in Render dashboard
7. Deploy and get your live URL

---

## Option 4: Vercel Deployment

### Steps:
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Add environment variables in Vercel dashboard

---

## Option 5: DigitalOcean App Platform

### Steps:
1. Go to DigitalOcean App Platform
2. Connect your GitHub repository
3. Configure build and run commands:
   - Build: `npm install`
   - Run: `npm start`
4. Add environment variables
5. Deploy

---

## Important Notes:

### Environment Variables Required:
- `COINMARKETCAP_API_KEY`
- `COINGECKO_API_KEY` 
- `GITHUB_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `EMAIL_USER`
- `EMAIL_PASS`
- `PRICE_CHANGE_THRESHOLD`

### WebSocket Considerations:
- Some platforms may require WebSocket configuration
- For Heroku, WebSocket works automatically
- For Railway/Render, ensure WebSocket support is enabled

### Free Tier Limitations:
- Heroku: 550-1000 free hours/month
- Railway: $5 credit monthly
- Render: 750 hours/month free
- Vercel: Hobby plan limitations

### Recommended: Start with Heroku for easiest deployment!
