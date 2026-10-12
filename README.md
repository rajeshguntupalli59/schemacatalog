# DB Documenter

**A free, self-hosted tool that turns your database schema into clean, browseable documentation.**

Point DB Documenter at your PostgreSQL or SQL Server database and it instantly generates documentation for every table, column, index, foreign key, and view — in your browser, exportable to PDF. 100% free, no signup, no license key.

## Demo

Watch the 13-second tour (the interactive demo on the website documents a sample schema right in your browser):

<video src="https://rajeshguntupalli59.github.io/db-documenter/demo.mp4" controls preload="metadata"></video>

Or try it live: paste `CREATE TABLE` statements into the demo at https://rajeshguntupalli59.github.io/db-documenter/ — no signup, no database needed.

---

## What it does

- **Schema documentation** — connect and get every table with its columns, data types, nullability, defaults, primary keys, and column comments
- **Indexes & foreign keys** — see exactly which columns are indexed and how tables relate
- **Views** — full SQL definition for every view
- **Search** — instantly filter hundreds of tables by name
- **Schema snapshots & diff** — save a snapshot of your schema, then compare any two snapshots (or a snapshot vs. the live database) to see exactly what changed: added/removed tables, new/removed/altered columns, index and foreign-key changes. Perfect for reviewing migrations before they ship
- **PDF export** — one click to a clean, shareable document via your browser's print dialog

## Supported databases

| Database | Versions |
|---|---|
| PostgreSQL | 13, 14, 15, 16, 17 |
| Microsoft SQL Server | 2017, 2019, 2022, Express, Azure SQL |

What gets captured: table/column comments (PostgreSQL) and `MS_Description` extended properties (SQL Server), row estimates, full type strings like `varchar(255)` and `numeric(10,2)`.

---

## Installation

DB Documenter ships as a zip with a Python backend and a React frontend. Extract it, then:

**1. Start the backend**
```bash
cd db-documenter-v1.0.0/backend
pip install -r requirements.txt
uvicorn main:app --port 8001
```
(Windows PowerShell: `cd backend; uvicorn.exe main:app --port 8001` — see USER_GUIDE.md)

**2. Start the frontend** (in a second terminal)
```bash
cd db-documenter-v1.0.0/frontend
npm install
npm run dev
```

**3. Open the app** — go to `http://localhost:5173` in your browser.

See [USER_GUIDE.md](USER_GUIDE.md) for the full manual.

---

## How to use it

1. **Connect** — pick PostgreSQL or SQL Server, enter host, port, database, username, password. Credentials are used for the session only and never stored.
2. **Browse** — the sidebar lists every table and view. Click one to see its columns, indexes, and foreign keys.
3. **Snapshot** (optional) — open the Snapshots tab, name the current schema, and save it. After a migration, compare the new scan against the snapshot to review exactly what changed.
4. **Export** — hit **Export PDF** any time for a shareable document.

---

## Security

- **No cloud dependency.** Nothing leaves your machine except your own database connection.
- **No telemetry.** No usage data or analytics.
- **Credentials are session-only.** They are never written to disk.

---

## System requirements

| Requirement | Minimum |
|---|---|
| OS | Windows 10 / Server 2019, Ubuntu 20.04+, macOS 12+ |
| RAM | 2 GB |
| Disk | 500 MB |
| Docker | Only if you use the Docker package |

For SQL Server connections, the machine running DB Documenter needs the Microsoft ODBC Driver 17 or 18 for SQL Server.

---

## License

Free. Use it, share it, run it on as many servers as you like. Provided as-is with no warranty.

---

*DB Documenter v1.0*
