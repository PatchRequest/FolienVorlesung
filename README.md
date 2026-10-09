# Offensive Security — Vorlesungsfolien

Lecture slides for the Offensive Security course at DHBW Mannheim, served through a self-hosted markdown presentation tool.

## Topics

- **Introduction** — course overview, legal framework, pentest methodology, vocabulary
- **OSINT** — open source intelligence, social media, search engines, databases
- **Physical Pentesting** — social engineering, badge cloning, lock bypasses, implants
- **Web Hacking** — HTTP, injection, authentication, OWASP
- **Active Directory** — Kerberos, NTLM, credential attacks, AD CS
- **Pivoting** — tunneling, port forwarding, proxychains
- **Command & Control** — C2 architecture, Mythic, agent development, EDR evasion
- **Advanced C2** — redirectors, LOTS, exfiltration, anti-analysis
- **Game Hacking** — memory manipulation, DLL injection, kernel drivers, DMA

## Quick Start

```bash
cd rzpresentor
npm install
cp .env.example .env

# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

Open http://localhost:5173 and log in.

**Default credentials:** `admin` / `admin`

The database ships pre-populated with all lecture slides. The default account has admin privileges.

### Docker

```bash
cd rzpresentor
cp .env.example .env
docker compose up --build
```

Access at http://localhost:3000

## Repository Structure

```
images/        # Slide images and pre-rendered mermaid SVGs
rzpresentor/   # Web application (Node.js + React)
  data/        # SQLite database with all slides
  server/      # Express backend
  src/         # React frontend
  scripts/     # Mermaid renderer
```

## License

MIT
