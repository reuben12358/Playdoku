# ⚽🏀🏈 Playdoku

**The daily sports trivia grid game.**

Guess the player that fits both the row and column categories. A new puzzle every day — for **football**, **basketball**, and **NFL**!

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

- **3x3 grid** — each row and column has a category
- **Click a cell**, search for a player, and lock in your answer
- The player must match **both** the row and column criteria
- Each cell can only be attempted once
- **New puzzle daily** — same puzzle for everyone, powered by a date-seeded algorithm

## 🏟️ Three Sports, One Game

Switch between **Football**, **Basketball**, and **NFL** with the toggle in the header. Each sport has its own daily puzzle, stats, and theme.

### ⚽ Football Categories

| Type | Examples |
|------|----------|
| **Clubs** | Real Madrid, Barcelona, Man United, Liverpool, Chelsea, Arsenal, Bayern Munich, Juventus, AC Milan, PSG, and more |
| **Countries** | Brazil, Argentina, France, Germany, Spain, England, Italy, Portugal, Netherlands |
| **Leagues** | Premier League, La Liga, Serie A, Bundesliga, Ligue 1 |
| **Positions** | Goalkeeper, Defender, Midfielder, Forward |
| **Awards** | Ballon d'Or, World Cup Winner, Champions League Winner |

### 🏀 Basketball Categories

| Type | Examples |
|------|----------|
| **Teams** | Lakers, Celtics, Bulls, Warriors, Heat, Spurs, Nets, 76ers, Mavericks, Nuggets, and more |
| **Countries** | USA, Canada, France, Germany, Spain, Serbia, Greece, Australia, Cameroon, Slovenia |
| **Conferences** | Eastern Conference, Western Conference |
| **Positions** | Point Guard, Shooting Guard, Small Forward, Power Forward, Center |
| **Awards** | MVP, NBA Champion, Finals MVP, DPOY |

### 🏈 NFL Categories

| Type | Examples |
|------|----------|
| **Teams** | All 32 NFL teams — Chiefs, Patriots, 49ers, Cowboys, Packers, Steelers, Eagles, Ravens, and more |
| **Conferences** | AFC, NFC |
| **Positions** | Quarterback, Running Back, Wide Receiver, Tight End, Linebacker, Defensive End, Cornerback, Safety, and more |
| **Awards** | MVP, Super Bowl Champion, Super Bowl MVP, DPOY |

## ✨ Features

- 🔄 **Daily puzzles** — deterministic generation means everyone gets the same challenge
- 🏀⚽🏈 **Three sports** — switch between football, basketball, and NFL with one tap
- 🔍 **Hybrid search** — local database + live results from TheSportsDB API
- 💾 **Progress saved** — come back anytime, your game state persists
- 📊 **Stats tracking** — games played, correct answers, streaks (per sport)
- 🎨 **Dynamic themes** — green for football, orange for basketball, navy for NFL
- 📱 **Mobile-friendly** — plays great on any device
- 📋 **Shareable results** — share your grid with friends

```
Playdoku Football #1 - 7/9
🟩🟩🟩
🟩⬜🟩
🟩🟥⬜
```

## 🛠️ Tech Stack

Pure vanilla web — no frameworks, no build step, no dependencies.

```
Playdoku/
├── index.html            # Single-page app
├── css/styles.css        # Responsive styles with dynamic theming
├── js/
│   ├── app.js            # Main game logic & sport switching
│   ├── sports.js         # Sport configs (categories, themes)
│   ├── puzzle.js         # Date-seeded puzzle generation
│   ├── game.js           # State management & persistence
│   ├── api.js            # TheSportsDB live search
│   └── utils.js          # Toast notifications
└── data/
    ├── players.json      # Football player database (150+)
    ├── nba_players.json  # Basketball player database (120+)
    └── nfl_players.json  # NFL player database (120+)
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
  Made with ⚽🏀🏈 by <a href="https://github.com/reuben12358">Reuben D'cunha</a>
</p>
