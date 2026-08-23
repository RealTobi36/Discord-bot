# 🛡️ Discord Mod Bot

Ein vollwertiger, selbst gehosteter Discord-Moderations-Bot, gebaut mit **[discord.js v14](https://discord.js.org/)**.
Er bringt alles mit, was ein Moderations-Team braucht: Bannen, Kicken, Timeouts, Mutes, Verwarnungen,
Nachrichten-Bereinigung, Kanal-Sperren, Slowmode, ein konfigurierbares AutoMod-System und ein zentrales
Moderations-Log.

> **Hinweis:** Slash-Commands (`/`) — moderne, typsichere Befehle mit Autovervollständigung im Discord-Client.

---

## ✨ Features

### 🛡️ Moderation
| Befehl | Beschreibung |
|---|---|
| `/ban <mitglied> [grund] [nachrichten-löschen]` | Mitglied bannen, optional dessen Nachrichten löschen |
| `/unban <nutzer-id> [grund]` | Ban anhand der User-ID aufheben |
| `/kick <mitglied> [grund]` | Mitglied vom Server kicken |
| `/timeout <mitglied> <dauer> [grund]` | Discord-natives Timeout setzen (bis zu 28 Tage) |
| `/untimeout <mitglied> [grund]` | Timeout aufheben |
| `/mute <mitglied> [dauer] [grund]` | Mitglied mit Mute-Rolle stummschalten (temporär/permanent) |
| `/unmute <mitglied> [grund]` | Mute-Rolle entfernen (unterstützt Auto-Unmute) |
| `/warn <mitglied> <grund>` | Verwarnung aussprechen (mit DM-Benachrichtigung) |
| `/warnings <mitglied>` | Alle Verwarnungen eines Mitglieds anzeigen |
| `/unwarn <warn-id>` | Einzelne Verwarnung entfernen |
| `/clearwarns <mitglied>` | Alle Verwarnungen eines Mitglieds löschen |
| `/clear <anzahl> [mitglied]` | 1–100 Nachrichten (gefiltert) löschen |
| `/nuke [grund]` | Kanal klonen & zurücksetzen |
| `/lock [kanal] [grund]` | Kanal für alle sperren |
| `/unlock [kanal] [grund]` | Kanal entsperren |
| `/slowmode <dauer> [kanal] [grund]` | Slowmode setzen (`5s`, `5m`, `0` = aus) |

### ⚙️ Einstellungen
| Befehl | Beschreibung |
|---|---|
| `/setlogchannel <kanal>` | Zentralen Mod-Log-Kanal festlegen |
| `/setmuterole <rolle>` | Mute-Rolle für `/mute` festlegen |
| `/automod status` | Aktuelle AutoMod-Konfiguration anzeigen |
| `/automod toggle <aktiv>` | AutoMod komplett ein-/ausschalten |
| `/automod schutz <art> <aktiv>` | Einzelne Schutzmaßnahmen (de)aktivieren |
| `/automod spam-einstellungen` | Spam-Schwelle, Intervall & Duplikate einstellen |
| `/automod max-mentions <anzahl>` | Max. Erwähnungen pro Nachricht festlegen |
| `/automod woerter <aktion> [wort]` | Verbotene Wörter verwalten |
| `/automod zuruecksetzen` | Alle AutoMod-Einstellungen zurücksetzen |

### ℹ️ Info
| Befehl | Beschreibung |
|---|---|
| `/help` | Übersicht aller Befehle |
| `/ping` | Bot-/WebSocket-Latenz & Uptime |
| `/serverinfo` | Server-Statistiken |
| `/userinfo [mitglied]` | Mitglieds-Details inkl. Verwarnungen |
| `/avatar [mitglied]` | Avatar in voller Auflösung |

### 🤖 AutoMod (automatisch)
- **Anti-Spam** — erkennt zu viele Nachrichten in kurzer Zeit
- **Duplikat-Erkennung** — blockt wiederholte gleiche Nachrichten
- **Invite-Filter** — entfernt Discord-Invite-Links
- **Link-Filter** — blockt externe URLs (optional)
- **Mention-Spam** — limitiert Erwähnungen pro Nachricht
- **Wortfilter** — eigene Liste verbotener Wörter
- Bei Verstößen: Nachricht löschen + DM-Warnung + 10-Minuten-Timeout + Mod-Log-Eintrag

### 🔒 Sicher
- Rollen-Hierarchie-Checks (niemand kann höherrangige Mitglieder moderieren)
- Bot-Berechtigungs-Prüfungen mit klaren Fehlermeldungen
- Serverbesitzer, Administratoren und Mitglieder mit Nachricht-Management sind von AutoMod ausgenommen
- Saubere Fehlerbehandlung & Logging

---

## 📁 Projektstruktur

```
Discord-bot/
├── index.js                 # Einstieg: lädt Commands/Events, loggt ein
├── config.js                # Konfiguration (Farben, Emojis, AutoMod-Defaults)
├── package.json
├── .env.example             # Vorlage für Umgebungsvariablen
├── data/                    # Erstellt automatisch (JSON-Datenbank, ignoriert)
└── src/
    ├── deploy-commands.js   # Registriert Slash-Commands bei Discord
    ├── database.js          # JSON-basierte DB (Guild-Settings, Warns, Mutes)
    ├── logger.js            # Eigenes Logging mit farbigen Levels
    ├── commands/
    │   ├── general/         # help, ping, serverinfo, userinfo, avatar
    │   ├── moderation/      # ban, kick, mute, warn, clear, ...
    │   └── config/          # setlogchannel, setmuterole, automod
    ├── events/
    │   ├── ready.js
    │   ├── interactionCreate.js
    │   ├── messageCreate.js     # AutoMod-Logik
    │   ├── guildMemberAdd.js    # Mute-Wiederherstellung
    │   └── guildBanAdd.js       # Externe Ban-Aktivitäten loggen
    └── utils/
        ├── embeds.js        # Standard-Embeds (success/error/warning)
        ├── modLog.js        # Mod-Log-Versand
        ├── permissions.js   # Berechtigungs- & Hierarchie-Checks
        └── time.js          # Zeit-Parsing & Formatierung
```

---

## 🚀 Installation

### 1. Voraussetzungen
- **[Node.js](https://nodejs.org/) v18 oder neuer**
- Eine Discord-Anwendung mit Bot-Token ([Discord Developer Portal](https://discord.com/developers/applications))

### 2. Repository klonen & Dependencies installieren
```bash
git clone https://github.com/RealTobi36/Discord-bot.git
cd Discord-bot
npm install
```

### 3. Umgebungsvariablen konfigurieren
Kopiere die Vorlage und trage deine Werte ein:
```bash
cp .env.example .env
```

`.env`:
```env
DISCORD_TOKEN=dein-bot-token
CLIENT_ID=deine-application-client-id
GUILD_ID=          # Optional: für sofortige Guild-Commands (Development)
```

### 4. Bot einladen

Im Developer Portal unter **OAuth2 → URL Generator**:

1. Wähle die Scopes `bot` und `applications.commands`
2. Wähle folgende Bot-Berechtigungen:
   - Manage Roles, Kick Members, Ban Members
   - Moderate Members, Manage Messages
   - Manage Channels, Read Messages/View Channels
   - Send Messages, Embed Links, Read Message History
3. Öffne die generierte URL und lade den Bot auf deinen Server ein.

> 💡 Schiebe die Bot-Rolle in der Server-Einstellung **Über Rollen** möglichst weit nach **oben**,
> damit er alle anderen Rollen moderieren kann.

### 5. Slash-Commands registrieren
```bash
npm run deploy
```
- Mit gesetzter `GUILD_ID` sind die Commands **sofort** verfügbar (Empfehlung für Entwicklung).
- Ohne `GUILD_ID` werden sie **global** registriert (kann bis zu 1 Stunde dauern).

### 6. Bot starten
```bash
npm start
```

Für die Entwicklung mit automatischem Neustart bei Änderungen:
```bash
npm run dev
```

---

## ⚙️ Ersteinrichtung im Server

Nach dem Start:

1. **Log-Kanal festlegen:**
   ```
   /setlogchannel kanal:#mod-logs
   ```
2. **Mute-Rolle festlegen** (erstelle eine Rolle "Gemuted" ohne Schreibrechte):
   ```
   /setmuterole rolle:@Gemuted
   ```
3. **AutoMod aktivieren:**
   ```
   /automod toggle aktiv:True
   /automod status
   ```

---

## 🛠️ Nützliche Befehle

| Befehl | Aktion |
|---|---|
| `npm start` | Bot starten |
| `npm run dev` | Bot mit Auto-Reload starten |
| `npm run deploy` | Slash-Commands (neu) registrieren |

---

## 📝 Datenhaltung

Alle Einstellungen, Verwarnungen und temporären Mutes werden in `data/db.json` gespeichert
(atomare Schreibvorgänge). Die Datei und der Ordner `data/` sind über `.gitignore` von Git
ausgeschlossen. Für große Server oder ein Multi-Server-Setup lässt sich die `database.js`
problemlos gegen SQLite/PostgreSQL austauschen.

---

## 🧩 Mitwirken

Pull Requests sind willkommen! Bitte achte darauf, dass neue Commands dem bestehenden
Schema folgen (`data` als `SlashCommandBuilder` und `execute(interaction, client)`) und
die Berechtigungs-Checks aus `utils/permissions.js` verwenden.

## 📄 Lizenz

MIT
