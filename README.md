# Sarcoma Knowledge Mapping Tool

A collaborative web application for managing and exporting the Sarcoma knowledge base. 

**Live Application:** [https://knowledge-sarcoma-mapping.vercel.app/](https://knowledge-sarcoma-mapping.vercel.app/)

## Overview
This tool transforms complex Excel mapping files (Anatomy, Morphology, ICD-10) into a structured JSON knowledge database used by openEHR systems. Originally a CLI tool, it has been evolved into a fully collaborative web platform.

## Key Features
- **Collaborative "Master" Data**: The application serves as a single source of truth. Users work on shared "Master" Excel files stored in the cloud.
- **Persistent Storage**:
  - **Excel Files**: Stored securely in **Vercel Blob**.
  - **Metadata**: Configuration and version tracking managed by **Vercel Postgres** (via Prisma).
- **Interactive UI**:
  - Drag-and-drop file upload.
  - JSON preview with "Detailed" and "Compact" views.
  - Searchable and filterable data tables.
- **Safe Versioning**: Automatic file versioning ensures no data is accidentally overwritten.

## Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database**: [Vercel Postgres](https://vercel.com/postgres)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **File Storage**: [Vercel Blob](https://vercel.com/blob)
- **Styling**: Tailwind CSS / Custom Glassmorphism UI
- **Deployment**: [Vercel](https://vercel.com/)

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ehrforce/knowledge-sarcoma-mapping.git
   cd knowledge-sarcoma-mapping
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   You need to link a Vercel project to get the simplified environment variables:
   ```bash
   npx vercel link
   npx vercel env pull .env.local
   ```
   *Alternatively, create a `.env` file with `POSTGRES_PRISMA_URL` and `BLOB_READ_WRITE_TOKEN`.*

4. **Run Development Server**
   ```bash
   pnpm dev
   ```

## CLI Usage (Legacy)
The project still supports the original CLI functionality:
```bash
npm run generate -- -f ./excel/mapping.xlsx
```
