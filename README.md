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
