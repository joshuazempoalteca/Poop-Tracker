# 💩 DooDoo Log

**The warm, friendly, and humorous tracker for your daily movements.**

DooDoo Log is a modern web application built to help users track their bowel health using the **Bristol Stool Scale**, while making the experience engaging through **Gamification (RPG elements)** and **AI-powered insights**.

---

## 🚀 Key Features

### 📝 Smart Logging
- **Bristol Stool Scale**: Visual selector for Types 1-7 with health descriptions.
- **Detailed Metrics**: Track duration, size, color, weight (optional), and pain levels (0-10).
- **Flags**: Boolean toggles for "Clogged Toilet" and "Blood Presence".
- **Wipe Counter**: Track how many wipes it took (clean wipes get AI praise!).

### 🎮 Gamification System
Turn your bathroom breaks into an RPG!
- **XP Calculation**:
  - **Base XP**: 50 per log.
  - **Size Multipliers**: Small (1.0x) to Massive (2.0x).
  - **Health Bonus**: 
    - **Type 3 & 4 (Ideal)**: **1.5x Multiplier** (The "Gold Standard").
    - **Type 2 & 5**: 1.1x Multiplier.
    - **Others**: 1.0x.
  - **Weight Bonus**: +0.2 XP per gram.
  - **Penalties**: -50 XP for blood presence.
- **Leveling**: Gain levels every 500 XP.
- **Prestige**: Unlock "Prestige Mode" after Level 55 to reset stats and gain badges.

### 🤖 AI Companion
- Powered by **Google Gemini 2.5 Flash**.
- Generates witty, humorous, or supportive commentary based on your log data.
- *Example*: "Congratulations on a Type 4! That's the gold standard of bowel movements. Keep eating that fiber!"

### 👥 Social (Simulated Cloud)
- **Friend Feed**: See logs from friends in a timeline.
- **Reactions**: React to friends' logs with 💩, 🎉, 😨, etc.
- **Friend Management**: Search for and add simulated users (e.g., "Gary_The_Log", "LisaLogs").
- *Note*: This uses a "Local Cloud Simulation" service. Data persists in LocalStorage but behaves like a real network request.

### 📊 Analytics
- **Stats Dashboard**: Visual charts for Type Distribution, Time Spent per Day, and XP Growth.
- **History List**: Searchable, filterable list of all past logs.
- **CSV Export**: Download your entire medical history for your doctor.

---

## 🛠 Tech Stack

- **Frontend**: React 19
- **Styling**: Tailwind CSS (Custom Brown/Stone Color Palette)
- **AI**: Google GenAI SDK (`@google/genai`)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Persistence**: Browser LocalStorage

---

## 📦 Setup & Installation

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure API Key**
   - You need a Google Gemini API Key.
   - Set it in your environment variables as `API_KEY`.
4. **Run the app**
   ```bash
   npm start
   ```

---

## 📂 Project Structure

- **`components/`**: UI building blocks (LogForm, HistoryList, StatsDashboard).
- **`services/`**: Business logic separation.
  - `gamificationService.ts`: XP and Level math.
  - `geminiService.ts`: AI prompt engineering.
  - `storageService.ts`: LocalStorage wrapper.
  - `friendsService.ts`: Simulated backend for social features.
- **`constants.ts`**: Configuration for Bristol Scale data and Game Rules.
- **`types.ts`**: TypeScript interfaces.

---

## 🔒 Privacy
All data is stored locally in your browser's `localStorage`. The "Social" features are simulated locally; no personal health data is actually sent to a remote server (except the text prompt sent to Google Gemini for AI analysis, if enabled).