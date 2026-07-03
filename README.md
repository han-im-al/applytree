# Applytree

A full-stack job application tracker featuring a clean, minimalist UI (slate/indigo styling). It persists user records to a database (supporting **SQLite** out-of-the-box and **PostgreSQL/AWS RDS** in production), uses **JWT Authentication** (Login/Signup) to secure user data, and **automatically compiles unauthenticated static portfolio pages** for candidates to share with recruiters.

---

## Key Features
- **JWT Authentication**: Secure user registration and login with bcrypt password hashing. Dashboard APIs are protected and scoped strictly to the authenticated user.
- **Auto-Syncing Public Portfolios**: Modifying records (Add, Edit, Delete) instantly triggers the compiler to rebuild and overwrite the user's unique static HTML file at `public/shares/[uuid].html`. These pages are unauthenticated (read-only) so recruiters can view them immediately without registering.
- **Funnels & Timelines**: Embedded **Google Charts Sankey Funnel** (Applied ➔ OA ➔ Interview ➔ Offer/Reject/Withdrawn) and **Chart.js Bar Chart** (applied over time). *Active (Pending) applications are automatically excluded from the Sankey funnel to focus on finalized workflows.*
- **Interactive Inline Pipelines**: Select pipeline status (Applied, Online Assessment, Interview) or decision status (Pending, Offer, Rejected, Withdrawn) directly from dropdown menus in the main list view. Changes auto-save to the database and sync the public share page instantly.
- **Minimalist Aesthetic**: Strip-down slate/white light mode UI focused on content, clear borders, and high contrast.
- **Relational Persistence**: Uses **Sequelize ORM** supporting SQLite, local PostgreSQL (Docker), and AWS RDS in production.

---

## Quick Start (Zero-Configuration SQLite)

Runs on local SQLite (`database.sqlite`) with no external database installation needed.

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start the Server**:
   ```bash
   npm start
   ```
3. **Open the App**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
4. **Log In**:
   - Log in using the pre-seeded account:
     - **Email**: `jane@example.com`
     - **Password**: `password123`
   - Once logged in, you will see Jane Doe's 12 mock job applications loaded from the database, demonstrating the Sankey funnel and timeline charts!

---

## Local Development (PostgreSQL via Docker)

To run the app locally using a PostgreSQL database instead of SQLite:

1. **Start the PostgreSQL Docker Container**:
   Ensure Docker Desktop is running on your computer, then execute:
   ```bash
   docker-compose up -d
   ```
2. **Configure Environment**:
   Open `.env` in the root directory and select PostgreSQL:
   ```env
   # DATABASE_URL=sqlite://database.sqlite
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/jobtracker
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```

---

## Production Deployment Guide (AWS RDS PostgreSQL)

To provision a production database on AWS RDS:

### Step 1: Provision the RDS PostgreSQL Instance
1. Log in to the [AWS Management Console](https://aws.amazon.com/).
2. Navigate to **RDS** and click **Create database**.
3. Select **Standard create** ➔ **PostgreSQL** ➔ **Free tier** template.
4. Settings:
   - *DB instance identifier*: `applytree-db`
   - *Master username*: `postgres`
   - *Master password*: Select a password (e.g., `MyPassword123`)
5. Connectivity:
   - *Public access*: **Yes** (Enables external connections).
6. Click **Create database**.

### Step 2: Configure Network Firewall (Security Group)
1. Go to your RDS database details page and click the link under **VPC security groups**.
2. Select the security group, scroll down, and click **Edit inbound rules**.
3. Add a new rule:
   - **Type**: PostgreSQL (Port 5432).
   - **Source**: Select **My IP** (Auto-blocks other external traffic for security).
4. Save rules.

### Step 3: Connect your App
1. Copy the RDS **Endpoint** (looks like `applytree-db.xxxxxx.us-east-1.rds.amazonaws.com`).
2. Update your `.env` file with your credentials:
   ```env
   DATABASE_URL=postgresql://postgres:MyPassword123@applytree-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/postgres
   ```
3. Restart your Node server (`npm start`). It will connect to AWS, sync the database, and seed the default user!

---

## How to highlight this on your Resume 📄

> **Full-Stack Software Engineer — Applytree**
> - Architected a full-stack job application tracker using Node.js/Express and Sequelize ORM, integrating dynamic database adapters for local development (SQLite) and **production hosting (PostgreSQL on AWS RDS)**.
> - Implemented **JWT token authentication** and password security using bcryptjs, securing API endpoints with route-guarding middleware.
> - Built a server-side static page compiler that automatically generates and updates unauthenticated, read-only portfolio pages (`public/shares/[uuid].html`) upon user mutations, optimizing recruiter accessibility.
> - Designed a clean, minimalist UI layout featuring interactive client-side data updates (inline table selectors) and visualizations with Chart.js and Google Charts Sankey diagrams.
