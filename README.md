# Bandhilki (Aura) - Community Good Deeds Platform

Welcome to **Bandhilki** (previously Aura), a modern, open-source social platform for celebrating small acts of kindness, tracking your aura score, and encouraging a friendlier world!

---

## 🌏 Features

- 📱 **Responsive Web App** – Works beautifully on all devices
- 🪄 **Supabase Auth** + Social sign-in supported
- ✨ **Aura Points System** – Get rewarded for posting, boosting, commenting, and sharing
- 🏆 **Top Aura Users** – Motivation through positive leaderboards
- 🙌 **Boost (Like) System** – One boost per user, can’t boost your own post
- 💬 **Comments** – Positive, text-only discussion on every post
- 🔗 **Share** – Quick social link sharing, tracked for aura
- 👤 **Profile Pages** – View and edit your own (and others’) aura, bio, and deeds
- 📷 **Image Upload** – Share real-world good deeds (single/multi-image support coming)
- 🔍 **Explore Page** – Discover and search positive posts across the community
- 🔒 **Secure by Default** – All secrets, .env, and keys ignored in .gitignore

---

## 🧑‍💻 Tech Stack

- **Frontend:** React + Vite
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Realtime:** Supabase subscriptions (live updates)
- **Styling:** Custom CSS (no heavy UI frameworks)

---

## 🚀 Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/your-user/bandhilki.git
   cd bandhilki
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy and edit your local `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in Supabase project URL and anon key.
4. Start development:
   ```bash
   npm run dev
   ```
5. Open `localhost:5173` and sign up!  
   You can also connect your Supabase project in the dashboard.

_Note: Never commit `.env`, API keys, or secrets—these are safely ignored by `.gitignore`._

---

## 📁 Project Structure

```
src/
  components/     # App UI (Feed, ContextPanel, Modals, etc.)
  pages/          # Major views (Dashboard, Upload, Auth, etc.)
  lib/            # Supabase client, aura service, helpers
  index.css       # Global theming
public/
  vite.svg        # Any public assets
```

---

## 🛡️ Important: Setup Supabase DB

See `QUICK_SETUP.md` for copy-paste SQL to create required tables (`likes`, `comments`, `shares`, etc.), with Row Level Security and aura points function.

- Do **not** commit your Supabase API keys or admin secrets.
- All schema migration and confidential files are already in `.gitignore`.

---

## 🤝 Contributing

We welcome positivity!  
Fork, make a branch, and send a pull request.  
Ideas for new features or UI improvements? Open an issue or discussion.

---

## 📜 LICENSE

MIT License (Open source, see LICENSE file).

---

## 🙌 Acknowledgements

- Built with [Supabase](https://supabase.com/)
- Inspired by social good platforms and open-source kindness

---

**Bandhilki: Celebrate real-world kindness, earn aura with friends. Let’s spread joy, one post at a time!**
