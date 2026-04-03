# SmartQ Deployment Guide 🚀

Follow these steps to take your **SmartQ** application live!

## 1. Backend (Render / Railway)
1.  **Environment Variables:** Set the following in your host providers dashboard:
    - `MONGODB_URI`: Your MongoDB Atlas connection string.
    - `JWT_SECRET`: A strong random string for security.
    - `PORT`: Usually automatically set by the provider (e.g., 10000 on Render).
2.  **Startup Command:** `npm start` (Make sure `package.json` has `"start": "node server.js"`).

## 2. Frontend (Vercel / Netlify)
1.  **API URL:** Update `frontend/src/services/api.js` to point to your live backend URL (e.g., `https://smartq-api.onrender.com`).
2.  **Build Command:** `npm run build`.
3.  **Publish Directory:** `dist`.

## 3. Database (MongoDB Atlas)
1.  Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Whitelist your deployment's IP (or allow all `0.0.0.0/0` for testing).
3.  Copy the connection string and use it as `MONGODB_URI`.

## 💡 Important Tips
- **Socket.io:** Ensure your frontend socket connection string in `src/services/socket.js` also points to the live backend.
- **CORS:** Your backend `server.js` should allow your frontend's live URL.

Good luck with your launch! 
