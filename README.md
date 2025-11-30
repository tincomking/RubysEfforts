# 🎀 Ruby's Efforts (Rubyの努力)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Theme](https://img.shields.io/badge/theme-Kawaii%20Blue-A0D2EB.svg)

**Ruby's Efforts** is a gamified, "Kawaii" visual-style Progressive Web App (PWA) designed to help students prepare for the rigorous English standards of Singapore universities (such as NUS, NTU, and SMU). 

Designed specifically for a 15-year-old student, the app combines spaced repetition, active recall, and contextual learning into a daily 10-word habit, culminating in a "Weekly Boss Battle" every Friday.

---

## 🎯 Project Goal

The primary goal is to bridge the gap between standard secondary school English and **Academic English** required for higher education in Singapore. 

In the Singapore education system (A-Levels "General Paper" or Polytechnic modules), students are required to not just *know* words, but to use them to analyze, critique, and discuss complex global issues. This tool focuses on vocabulary that elevates writing from "descriptive" to "analytical."

---

## 🧠 Vocabulary Selection Methodology

The core engine of this app uses **Google Gemini 2.5 Flash** to generate vocabulary. The selection criteria are strictly prompted to ensure relevance.

### 1. The "Singapore University Standard"
Singapore universities require a high proficiency in English as the medium of instruction. The AI is instructed to select words based on:
*   **Academic Word List (AWL):** Words that appear with high frequency in academic texts across subjects (Arts, Science, Law, Business).
*   **Critical Thinking Nuance:** Words that allow for precise expression of arguments (e.g., instead of "change," use "fluctuate," "mitigate," or "revolutionize").
*   **Complexity:** Focusing on abstract nouns, strong verbs, and descriptive adjectives rather than concrete nouns.

### 2. Topic Rotation
To prevent boredom and ensure a breadth of knowledge, the app rotates through random academic domains for every daily generation:
*   Science & Technology
*   Arts & Humanities
*   Business & Economics
*   Social Sciences
*   Environmental Studies

### 3. Exclusion & Mastery
*   **Uniqueness:** The AI receives a list of the student's recent history to ensure no duplicates in the short term.
*   **Mastery Tracking:** Once a word is successfully passed in a Friday "Weekly Test," it is marked as `Mastered` and permanently excluded from future daily generations.

---

## ✨ Features

### 📅 Daily Training
*   **10 Words/Day:** Manageable cognitive load.
*   **Deep Learning:** Each card features the word, phonetic pronunciation (with AI-generated TTS), a concise definition, and an academic example sentence.
*   **Skip Logic:** If a word is too easy or known, it can be skipped and replaced instantly.

### ✍️ Active Recall (Spelling Phase)
*   **No Passive Reading:** Users must spell the word to proceed.
*   **Progressive Hints:** If the user struggles, the app reveals the word letter-by-letter to encourage learning without frustration.
*   **Scramble Mode:** Alternates between typing and unscrambling letter tiles.

### 🧩 Contextual Application (Quiz Phase)
*   **Fill-in-the-Blank:** Users must select the correct word to complete a *new* sentence context.
*   **Distractor Logic:** The AI generates plausible incorrect options (distractors) to test true understanding.

### ⚔️ Friday "Weekly Boss Battle"
*   **Cumulative Review:** On Fridays, the app switches modes. Instead of learning new words, it tests a random selection of words learned earlier in the week.
*   **No Hints:** A strict testing environment.
*   **PDF Report:** Upon completion, generates a printable PDF report of the week's results.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (Custom "Kawaii" Palette)
*   **AI Engine:** Google Gemini API (`gemini-2.5-flash` for logic, `gemini-2.5-flash-preview-tts` for audio)
*   **Icons:** Lucide React
*   **Avatar:** DiceBear API
*   **Build Tooling:** Vite (Implied)

---

## 🚀 Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/rubys-efforts.git
    cd rubys-efforts
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run Locally**
    ```bash
    npm start
    # or
    npm run dev
    ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

*Built with ❤️ for Ruby.*
