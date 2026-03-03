# Basketball Site

This repository contains a full-stack basketball statistics website, built with Next.js and SQLite.

## Project Structure

- `db/` - Contains the raw SQLite database (`nba_raw_data.db`) storing the basketball statistics. Because of its large size, the `.db` files are tracked using Git LFS.
- `nba-reference/` - The Next.js frontend application, which serves the user interface, APIs, game logs, and player stats.
- `skills/` - Custom operational scripts and development tools.

## Prerequisites

- **Node.js** (for running the frontend application)
- **Git LFS** (Git Large File Storage must be installed to pull the database)

## Setup

1. **Clone the repository:**
   Ensure you have Git LFS installed on your system before cloning, so the large SQLite `.db` file is downloaded correctly.

   ```bash
   git lfs install
   git clone https://github.com/nickth3man/basketball-site.git
   cd basketball-site
   ```

2. **Frontend Setup:**
   Navigate into the Next.js app directory to install dependencies and start the development server.

   ```bash
   cd nba-reference
   npm install
   npm run dev
   ```

For more comprehensive setup instructions regarding the frontend, please refer to the [nba-reference/README.md](nba-reference/README.md).

## Database Migration Strategy

The application uses a **read-only database** model. The SQLite database (`db/nba_raw_data.db`) contains pre-populated NBA statistics and is not modified by the application at runtime.

### Data Updates

When updating the database with new season data:

1. **Backup the current database** before making changes
2. **Use a separate ETL process** (outside this application) to populate new data
3. **Verify data integrity** before committing changes
4. **Commit the updated `.db` file** to Git LFS

### Schema Changes

If schema modifications are required:

1. **Version the schema** with migration scripts in `scripts/migrations/`
2. **Use a migration tool** such as:
   - [Prisma](https://www.prisma.io/) — Type-safe ORM with migration support
   - [Drizzle](https://orm.drizzle.team/) — Lightweight TypeScript ORM
   - [Flyway](https://flywaydb.org/) — SQL-based migrations
3. **Test migrations** against a copy of the database before applying to production
4. **Document schema changes** in commit messages and CHANGELOG

### No Runtime Migrations

This application does **not** perform database migrations at runtime. All schema changes must be applied during the data update process before deployment.
