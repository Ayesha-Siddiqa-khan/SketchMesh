# Product Requirement Document (PRD)

## Project Name: SketchMesh
**Tagline:** Connect Ideas. Map Thoughts. Build Together.  
**Version:** 1.0.0  
**Target Stack:** Next.js (App Router), PostgreSQL (Prisma ORM), Tailwind CSS, Docker, GitHub Actions, Terraform

---

## 1. Project Overview & Objective
**SketchMesh** is an open, collaborative social canvas and ideation platform where creators, developers, and architects express thoughts through a combined medium: narrative writing alongside an interactive vector sketch canvas. 

Users can document architectural concepts, workflows, mind maps, or creative sketches. The platform enables community discovery, one-click forking/remixing with lineage attribution, and coordinate-specific canvas feedback.

---

## 2. Core Functional Requirements

### 2.1 Dual-Pane Canvas & Text Studio
* **Narrative Section:** Markdown and rich-text editor for articulating context, problem descriptions, and implementation details.
* **Interactive Canvas Engine:** Integrated vector workspace powered by `@tldraw/tldraw` (or `@excalidraw/excalidraw`).
* **Tooling:** Freehand drawing, shapes (rectangles, ellipses), connectors, directional arrows, sticky notes, color palettes, and text blocks.
* **Snapshot Pipeline:**
  * Canvas nodes and coordinates serialize into a structured `JSONB` document.
  * Automatic generation of an optimized WebP/PNG preview image uploaded to S3-compatible storage for feed rendering.

### 2.2 Community Discovery Feed
* Infinite masonry feed showcasing community sketches.
* Card elements: Canvas thumbnail preview, title, author details, fork count, like count, and relative timestamps.
* Feed filters: `Trending`, `Most Recent`, `Most Remixed`.

### 2.3 Remix & Lineage Engine (Forking)
* Any public board can be forked with one click into a user's personal studio.
* Preserves bidirectional lineage (`forked_from_id`), displaying upstream attribution (e.g., *"Remixed from @developer's Microservices Topology"*).

### 2.4 Coordinate-Based Canvas Feedback
* Readers can pin discussions directly to coordinates $(x, y)$ on a canvas.
* Selecting an item in the comment drawer centers the viewport on that specific canvas component.

---

## 3. Database Schema Specification (PostgreSQL + Prisma)

### 3.1 `User` Model
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  posts         Post[]
  comments      Comment[]
}
```

### 3.2 `Post` Model
```prisma
model Post {
  id            String    @id @default(uuid())
  title         String    @db.VarChar(150)
  content       String    @db.Text
  sketchData    Json      // Serialized canvas vector state & nodes
  thumbnailUrl  String
  authorId      String
  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  forkedFromId  String?
  forkedFrom    Post?     @relation("PostRemixes", fields: [forkedFromId], references: [id], onDelete: SetNull)
  remixes       Post[]    @relation("PostRemixes")
  comments      Comment[]
  viewsCount    Int       @default(0)
  likesCount    Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([authorId])
  @@index([forkedFromId])
}
```

### 3.3 `Comment` Model
```prisma
model Comment {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  body      String   @db.VarChar(500)
  coordX    Float?   // Optional X position for canvas pins
  coordY    Float?   // Optional Y position for canvas pins
  createdAt DateTime @default(now())

  @@index([postId])
  @@index([authorId])
}
```

---

## 4. API & Route Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/posts` | Paginated feed of posts with author info and metadata |
| `POST` | `/api/posts` | Create a post (validates schema, canvas JSON, and thumbnail URL) |
| `GET` | `/api/posts/:id` | Fetch full post detail with complete `sketchData` JSON |
| `POST` | `/api/posts/:id/fork` | Clone an existing sketch into a new draft board |
| `GET` | `/api/posts/:id/comments` | Retrieve pinned comments for a specific canvas |
| `POST` | `/api/posts/:id/comments` | Post a comment pinned to canvas coordinates |
| `GET` | `/api/healthz` | Container liveness check (200 OK) |
| `GET` | `/api/readyz` | Container readiness check (validates database connectivity) |

---

## 5. DevOps & Infrastructure Specifications

The automated agent must observe the following platform requirements:

### 5.1 Next.js Configuration
* Set `output: 'standalone'` inside `next.config.js` for minimal production artifact size.
* Enforce strict client boundaries (`"use client"`) around canvas dependencies.

### 5.2 Container Architecture (`Dockerfile`)
* Three-stage build (`deps` -> `builder` -> `runner`) using `node:20-alpine`.
* Run under an unprivileged user (`USER nextjs`) with group `nodejs` (UID/GID 1001).
* Final production container image must be under 150MB.

### 5.3 CI/CD Workflow (`.github/workflows/deploy.yml`)
* Pipeline execution on `push` to `main` and all Pull Requests.
* Steps:
  1. Linting & TypeScript compilation verification.
  2. Multi-stage Docker build with caching enabled.
  3. Image vulnerability scan using Aquasecurity Trivy (blocking on `CRITICAL` findings).
  4. Push image to GitHub Container Registry (`ghcr.io`) with git commit SHA tag.

### 5.4 Object Storage Integration
* AWS SDK v3 client configurable via environment variables:
  * `S3_ENDPOINT` (Supports local MinIO or AWS S3)
  * `S3_BUCKET_NAME`
  * `S3_ACCESS_KEY`
  * `S3_SECRET_KEY`
  * `S3_REGION`

---

## 6. Acceptance Criteria
1. **Interactive Performance:** Canvas workspace maintains 60 FPS rendering on boards with up to 250 vector elements.
2. **Persistence Integrity:** Canvas vector states serialize and deserialize without loss of element grouping, styling, or positioning.
3. **Health Probes:** Kubernetes endpoints `/api/healthz` and `/api/readyz` respond with appropriate status codes based on application and database health.
4. **Local Orchestration:** The platform, PostgreSQL database, and MinIO storage spin up cleanly using a single `docker compose up` command.