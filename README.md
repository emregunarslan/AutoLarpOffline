# AutoLarp
Larping for cars.

Live site: https://autolarp.onrender.com/

## Run it

1. Get a MongoDB connection string. The free tier of [MongoDB Atlas](https://www.mongodb.com/atlas) works:
   create a cluster → **Connect** → **Drivers** → copy the `mongodb+srv://...` string
   (replace `<password>` with your database user's password). Under **Network Access**, allow your IP
   (or `0.0.0.0/0` while testing from Codespaces).
2. Install and start:
   ```
   npm install
   npm start
   ```
   The first time, it asks for the connection string and saves it to `.env` (which is git-ignored),
   so you only enter it once. You can also copy `.env.example` to `.env` and fill it in yourself.
3. Open http://localhost:8080 (in Codespaces: the **Ports** tab → port 8080).

Accounts, vehicles and photos are stored in MongoDB (database `autolarp`).

## AI assistant (optional)

The ✦ button on the garage and car pages opens a chat that can run vehicle controls
("lock all my cars", "turn on the climate") and recommend which car to take
("which car fits the most suitcases?"). It uses Google Gemini (`gemini-flash-latest` by default;
set `GEMINI_MODEL` to change it).

Add a Gemini API key (aistudio.google.com/apikey) as `GEMINI_API_KEY` in `.env`
(`npm start` offers to save it the first time) or in Render's Environment settings.
Without a key the site works normally and the chat says the assistant isn't set up.
