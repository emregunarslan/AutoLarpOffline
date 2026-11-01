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
