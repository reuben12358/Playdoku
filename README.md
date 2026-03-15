# ⚽ Playdoku

**The daily football trivia grid game.**

Guess the soccer player that fits both the row and column categories. A new puzzle every day!

🔗 **[Play Now → reuben12358.github.io/Playdoku](https://reuben12358.github.io/Playdoku/)**

---

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 🎮 How It Works

| | 🇧🇷 Brazil | 🔴 Man United | 🏆 UCL Winner |
|---|---|---|---|
| **⚪ Real Madrid** | ? | ? | ? |
| **🔵 Chelsea** | ? | ? | ? |
| **🇫🇷 France** | ? | ? | ? |

- **3×3 grid** — each row and column has a football category
- **9 guesses** — click a cell, search for a player, and lock in your answer
- The player must match **both** the row and column criteria
- **New puzzle daily** — same puzzle for everyone, powered by a date-seeded algorithm

## 🏟️ Categories

| Type | Examples |
|------|----------|
| **Clubs** | Real Madrid, Barcelona, Man United, Liverpool, Chelsea, Arsenal, Bayern Munich, Juventus, AC Milan, PSG, and more |
| **Countries** | Brazil, Argentina, France, Germany, Spain, England, Italy, Portugal, Netherlands |
| **Leagues** | Premier League, La Liga, Serie A, Bundesliga, Ligue 1 |
| **Positions** | Goalkeeper, Defender, Midfielder, Forward |
| **Awards** | Ballon d'Or, World Cup Winner, Champions League Winner |

## ✨ Features

- 🔄 **Daily puzzles** — deterministic generation means everyone gets the same challenge
- 🔍 **Smart search** — autocomplete from 150+ iconic footballers
- 💾 **Progress saved** — come back anytime, your game state persists
- 📊 **Stats tracking** — games played, correct answers, streaks
- 📱 **Mobile-friendly** — plays great on any device
- 📋 **Shareable results** — share your grid with friends

```
Playdoku #1 - 7/9
🟩🟩🟩
🟩⬜🟩
🟩🟥⬜
```

## 🛠️ Tech Stack

Pure vanilla web — no frameworks, no build step, no dependencies.

```
Playdoku/
├── index.html          # Single-page app
├── css/styles.css      # Responsive styles
├── js/
│   ├── app.js          # Main game logic
│   ├── puzzle.js       # Date-seeded puzzle generation
│   ├── game.js         # State management & persistence
│   └── utils.js        # Toast notifications
└── data/
    └── players.json    # Player database
```

## 🚀 Run Locally

Just open `index.html` in a browser, or serve it:

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`

## 📄 License

MIT

---

<p align="center">
  Made with ⚽ by <a href="https://github.com/reuben12358">Reuben D'cunha</a>
</p>
