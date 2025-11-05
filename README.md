# (Whatsapp Scheduler) Node.js + PostgreSQL + Redis

A simple whatsapp scheduler using node js multiworker, redis rate limiter, and postgresql for queue list

---

## ⚙️ Tech Stack

| Stack          | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| **Node.js**    | JavaScript runtime for building fast and scalable applications |
| **Express.js** | Web framework for Node.js                                      |
| **PostgreSQL** | Relational database for storing data                           |
| **Redis**      | In-memory data store for caching and rate limiting             |

---

## 🚀 Installation Guide

### 1. Clone the Project

```bash
git clone https://github.com/artapamudaid/wa-bulk-sender-service.git
cd wa-bulk-sender-service
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Database

Make sure PostgreSQL is running on your system.

Then open your PostgreSQL terminal or a tool like pgAdmin and run:

```sql
CREATE DATABASE wa_bulk_system;
```

### 4. Create Tables

Import the provided SQL file into your database:

```bash
psql -U your_username -d wa_bulk_system -f wa_bulk.sql
```

Or, if you prefer, copy the content of `database.sql` and run it manually in your PostgreSQL client.

### 5. Set Environment Variables

Modifiy `.env` file in the project root:

```
PORT=3020

DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASS=your_password
DB_NAME=wa_bulk_system

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASS=YOUR_REDIS_PASSWORD // keep empty if your redis not using password

PRIMARY_API=YOUR_PRIMARY_API_URL_HERE // your whatsapp service endpoint

STATIC_TOKEN=YOUR_STATIC_TOKEN_HERE // random string for simple auth credentials
```

### 6. Start Redis Server

```bash
redis-server
```

### 7. Start the Server

```bash
npm start
```

### 8. Test It

Open your browser or use curl/Postman to check:

```
http://localhost:3020
```

If you see a response — your project is running successfully! 🎉

---

## 📝 Notes

- Make sure PostgreSQL service is started before running the app.
- And redis-server is started before running the app.
- You can change the configuration settings inside the `.env` file anytime.

---

Made with ❤️ Arta Tri Pamuda
