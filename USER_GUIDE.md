# SchemaCatalog — User Guide

SchemaCatalog connects to your PostgreSQL or SQL Server database and instantly generates clean, browseable schema documentation — tables, columns, data types, indexes, foreign keys, and views — all in your browser.

---

## Getting Started

### Step 1: Start the backend

Open a terminal and run:

```powershell
cd C:\Users\rajes\schemacatalog\backend
.venv\Scripts\uvicorn.exe main:app --port 8001
```

### Step 2: Start the frontend

Open a second terminal and run:

```powershell
cd C:\Users\rajes\schemacatalog\frontend
npm run dev
```

### Step 3: Open the app

Go to **http://localhost:5173** in your browser.

---

## Connecting to a Database

On the connection screen:

1. **Select your database type** — click PostgreSQL or SQL Server at the top of the form
2. **Enter the host** — usually `localhost` for a local database
3. **Enter the port** — PostgreSQL default is `5432`, SQL Server default is `1433`
4. **Enter the database name** — the specific database to document
5. **Enter your username and password**
6. Click **Generate Documentation**

The tool scans your schema and loads the documentation in a few seconds.

> Your credentials are used only for this session. They are never stored to disk.

---

## Reading the Documentation

### Sidebar (left panel)

- Lists all **Tables** and **Views** in the database
- Use the search box to filter by name
- Click **Tables**, **Views**, **ER Diagram**, or **Snapshots** to switch views
- Click any table to view its full detail on the right

### Table detail (right panel)

Each table shows:

**Columns**
| Column | What it shows |
|--------|---------------|
| Name | Column name. A key icon marks primary key columns |
| Type | Data type with length/precision (e.g. `varchar(200)`, `numeric(10,2)`) |
| Nullable | YES or NO |
| Default | Default value or sequence (e.g. `nextval('id_seq')`) |
| Notes | Column comment if one is set in the database |

**Indexes**
- Index name, column(s) covered, and whether it is UNIQUE or the PRIMARY KEY

**Foreign Keys**
- Shows which column references which table and column in another table

### ER Diagram

Click the **ER Diagram** tab for a visual map of your schema. Each table shows its columns with key icons for primary keys (🔑) and foreign keys (🔗); blue lines trace the relationships (hover a line for details). Click any table to jump to its full documentation.

### AI Descriptions

Click **AI describe** on any table to generate a plain-English table description plus one-line descriptions for every column, using your own AI endpoint.

**Setup** (one time): click **AI settings** and enter:
- **Provider** — OpenAI-compatible or Ollama
- **Endpoint URL** — e.g. `https://api.openai.com/v1` or `http://localhost:11434`
- **API key** — stored on your machine, never sent anywhere except your endpoint
- **Model** — e.g. `gpt-4o-mini` or `llama3.1`

Generated descriptions appear inline with a "review before sharing" note. They are not saved to the database — re-generate anytime.

### Views

Click a view to see its full SQL definition.

---

## Schema Snapshots & Diff

The Snapshots tab lets you track how your schema changes over time — ideal for reviewing migrations before they ship.

**Saving a snapshot**
1. After scanning your database, open the **Snapshots** tab
2. Give the snapshot a name (e.g. `before-release-2.4`) and click **Save snapshot**

**Comparing schemas**
1. Pick any two snapshots — or one snapshot and the **live database**
2. Click **Compare**

The diff shows you exactly what changed:
- Tables added or removed
- Columns added, removed, or changed (including type changes like `varchar(50)` → `varchar(200)`)
- Indexes added, removed, or changed
- Foreign keys added or removed
- Views added, removed, or changed

A summary at the top counts added / removed / changed objects so you can spot a bad migration at a glance.

---

## Exporting to PDF

Click the **Export PDF** button in the top-right corner. Your browser's print dialog will open. Choose "Save as PDF" to get a clean document you can share with your team.

---

## PostgreSQL — What Gets Scanned

| Object | Details captured |
|--------|-----------------|
| Tables | Schema, name, row estimate, table comment |
| Columns | Name, type (via `format_type`), nullable, default, PK flag, column comment |
| Indexes | Name, covered columns, UNIQUE flag, PRIMARY flag |
| Foreign keys | Column → referenced table.column, constraint name |
| Views | Name, schema, full SQL definition |

**Schema filter:** System schemas (`pg_catalog`, `information_schema`, `pg_toast`) are excluded automatically.

---

## SQL Server — What Gets Scanned

| Object | Details captured |
|--------|-----------------|
| Tables | Schema, name, row count, `MS_Description` extended property |
| Columns | Name, type with precision, nullable, default, PK flag, column-level extended property |
| Indexes | Name, covered columns, UNIQUE flag, PRIMARY KEY flag |
| Foreign keys | Column → referenced table.column, constraint name |
| Views | Name, schema, full SQL definition |

**Requirements:**
- SQL Server 2017 or later (uses `STRING_AGG` for index columns)
- ODBC Driver 17 or 18 for SQL Server must be installed on the machine running SchemaCatalog

---

## Troubleshooting

**"Connection failed" error**
- Check that the database server is running and reachable on the specified host and port
- Verify your username and password are correct
- For SQL Server: confirm the ODBC Driver is installed (`ODBC Driver 17 for SQL Server` or `ODBC Driver 18 for SQL Server`)

**"No SQL Server ODBC driver found"**
- Download and install the Microsoft ODBC Driver for SQL Server from Microsoft's website

**Frontend shows a blank page**
- Make sure both the backend (port 8001) and frontend (port 5173) are running
- Check the browser console for errors

**Backend port 8001 already in use**
```powershell
(Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue).OwningProcess |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## Architecture

```
frontend (React + Vite)     →   backend (FastAPI)      →   Database
http://localhost:5173            http://localhost:8001
                                 POST /api/schema/scan
```

**Backend files:**
- `main.py` — FastAPI app, CORS config
- `scanner.py` — schema scanning logic for PostgreSQL and SQL Server
- `routers/schema.py` — `/api/schema/scan` endpoint

**Frontend files:**
- `src/App.jsx` — main layout (sidebar + detail panel)
- `src/components/ConnectionForm.jsx` — landing/connection screen
- `src/components/TableDetail.jsx` — table columns, indexes, FK display

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-05-13 | Initial release — PostgreSQL + SQL Server support |
