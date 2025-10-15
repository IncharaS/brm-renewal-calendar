# **BRM_RenewalCalendar_IncharaSrinivasa**

### *A full-stack Renewal Calendar platform that extracts contract metadata from Purchase Agreement PDFs, computes renewal timelines, and automates reminders and renewals.*

---

## **Overview**

The **BRM Renewal Calendar** is a production-grade, full-stack web application that ingests “Purchase Agreement” PDFs, intelligently extracts key contractual metadata, and presents a dynamic renewal calendar with automated notice and renewal tracking.

The project was designed to mirror BRM’s core business challenge of centralizing vendor agreements, detecting renewal obligations, and ensuring proactive alerts for upcoming deadlines.

Beyond the minimum deliverable of upload and calendar functionality, this implementation includes secure PDF ingestion and parsing, structured event computation with Pacific-timezone awareness, and automated renewal logic using Vercel Cron Jobs. The system also supports event sharing with another user, reminder scheduling, vendor and product intelligence in the UI, AWS S3-based secure file storage, email notifications, a feature-rich React calendar interface, and type-safe full-stack code powered by Next.js App Router and TypeScript with Drizzle ORM.

---

## **Tech Stack and Architecture**

The frontend uses **Next.js 14 (App Router)** with **TypeScript** and **Tailwind CSS**, chosen for its strong file-based routing and co-located API routes that enable easy SSR and client composition. TypeScript enforces type safety across shared components.

The backend leverages **Next.js Server Actions** and **Drizzle ORM** connected to **PostgreSQL**, deployed in a serverless architecture for scalability on Vercel. Drizzle provides strongly typed schema management and predictable SQL generation.

The **PostgreSQL database** ensures relational consistency, foreign-key safety between agreements and renewal events, and efficient time-based indexing for scheduling.

All uploaded files are stored securely in **AWS S3**, using pre-signed URLs for direct client access.

AI-driven metadata extraction is powered by **OpenRouter** OpenAI Chat Completions API with GPT-4 to transform parsed PDF text into structured JSON.

The **PDF parsing pipeline** combines `pdf-parse`, `pdf-lib` to cover all types of files — standard text PDFs, those with structural objects, and image-based scans.

Automated scheduling and renewal detection are handled by **Vercel Cron Jobs**, with two routes (`/api/reminders` and `/api/autoRenewCheck`) that execute daily to send reminder emails or auto-renew eligible contracts.

User authentication is implemented via **Clerk**, offering secure, lightweight identity management. **Resend API** handles email delivery for shares and reminders.

The application is deployed on **Vercel**, which integrates seamlessly with Next.js and manages cron scheduling and environment variables.

---

## **System Design Overview**

### **1. PDF to Events Pipeline**

When a user uploads a PDF to `/api/upload`, the server stores it in S3, downloads the buffer server-side, and attempts to extract raw text through a three-stage fallback pipeline. It first tries standard text extraction using `pdf-parse`, then structural parsing using `pdf-lib` as the fallback.
Once the text is extracted, the system sends it to an OpenRouter-backed LLM prompt that identifies and extracts fields such as the vendor name, product list (since the vendors are repeated, its easy to keep track if the user can see which products is the renewal about), effective date, end date, renewal terms, notice periods, and other relevant contract metadata.

After extraction, the data is normalized and stored in PostgreSQL through Drizzle ORM. Renewal events, including notice deadlines and term end dates, are automatically computed and inserted for each agreement.

---

### **2. Renewal Event Computation**

The function `computeRenewalEvents()` calculates all lifecycle events in **Pacific Time**, ensuring consistent behavior across deployments.

Manual agreements only record a single “term end” event, while auto-renewing agreements include both notice deadlines and renewal markers. The system’s cron jobs extend auto-renewing contracts automatically unless canceled before the notice date.

This logic mirrors real-world SaaS contract behavior, where auto-renew vendors cycle indefinitely until canceled, while manual renewals have definitive action points.

---

### **3. Reminder and Renewal Automation**

Two cron routes power automated operations.
The first, `/api/autoRenewCheck`, runs daily at 1 AM Pacific Time to detect auto-renew events(if not canceled) and extend their next cycle.
The second, `/api/reminders`, executes daily at 8 AM Pacific Time to send reminder emails 60, 30, 15, and 1 day before deadlines or renewal notices.

Each route validates authorization using a secure header comparison with an environment variable token to prevent unauthorized access.

---

### **4. Frontend UX and Product Design**

The upload workflow supports drag-and-drop functionality, parsing the uploaded PDF through the AI pipeline and inserting results into the database. The system displays toast notifications for success or failure and automatically retries parsing if a PDF appears corrupted.

The calendar dashboard groups renewal events by vendor and year, color-codes them by type (notice vs. term end), and allows filtering by vendor, event type, and status. Events are expandable and collapse smoothly, showing distinctions between manual and auto-renew workflows.

Each event card supports real-time actions such as renewing, canceling auto-renewal, deleting, marking completion, sharing, or viewing the original PDF. Expired events appear grayed out, while active ones remain actionable.

The share modal generates secure event links and sends formatted emails containing vendor details, product information, and a direct “Open Event” call-to-action.
Gantt Charts: provide a clear and intuitive visualization of all events across the year.
---

## **Data Model**

The database includes two main tables: **agreements** and **renewalEvents**.

The **agreements** table stores data such as the user ID (from Clerk), vendor name, list of products, effective and end dates, term lengths, auto-renewal flags, renewal term months, notice period days, and an S3 file key.

The **renewalEvents** table records events related to each agreement, including the event title, type (notice, term end, or info), event date, completion status, and the last reminder sent date to avoid duplicate notifications.

---

## **Engineering Decisions and Trade-offs**

A multi-stage PDF extraction pipeline was implemented to handle diverse document structures, favoring reliability over speed. This approach adds several seconds to processing time but ensures near-complete coverage across PDF types.

For field extraction, AI-based methods were chosen over regular expressions due to their superior adaptability to differing layouts and clause phrasing. The added API cost and latency were acceptable given the importance of accuracy and the low frequency of uploads.

Serverless cron jobs were selected instead of a self-hosted scheduler to reduce infrastructure complexity. While this limits granularity to daily intervals, it provides strong security and low maintenance overhead.

All time computations were normalized to the **America/Los_Angeles** timezone to match BRM’s business logic and eliminate off-by-one-day errors caused by UTC conversions.

The frontend was built using modular React components for event cards, modals, and timeline views. This slightly increases boilerplate code but significantly improves maintainability and testability.

---

## **Setup and Run Instructions**

### **Prerequisites**

You need Node.js version 18 or higher, PostgreSQL version 14 or higher, an AWS S3 bucket, an OpenRouter API key, and a Resend API key.

### **Environment Variables**

Create a file named `.env.local` with the following content:

```bash
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_S3_BUCKET_NAME=brm-calender
NEXT_PUBLIC_S3_AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
RESEND_API_KEY=...
CRON_SECRET=brm-secret-34728
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **Install and Run**

```bash
npm install
npm run dev
```
Then visit `http://localhost:3000` in your browser.
---

## **Future Enhancements**
Editable agreement fields for manual corrections, and role-based access control for multi-tenant organizations.
Comment/Notes fields in the shared events.
Planned next steps include adding dashboard analytics for renewal density and risk visualization.
Other priorities include a document validation layer using OpenAI function calling, an audit log and activity feed, and integrations with external platforms such as Google Calendar, Slack, and Salesforce.

---
## What I Deferred (Intentionally)

OCR Pipeline: While planned (tesseract.js), the provided PDFs were already text-based. Excluding OCR kept the stack lightweight and reliable.
Advanced Analytics: KPIs and trend dashboards were deferred to focus on correct date logic.
Collaborative User Roles: Role-based access and org hierarchies can extend from Clerk later.
Multi-LLM Fallback: GPT-4 proved sufficient; adding Claude/Gemini switching was out of scope for an MVP.
Mobile Optimizations: Focused on desktop first for clarity and demo readability.

## **Submission Details**

A hosted live demo at https://brm-renewal-calendar-sigma.vercel.app/

---

## **About Me**

**Inchara Srinivasa** is a Software Engineer and M.S. Computer Science graduate from Indiana University Bloomington, specializing in backend systems, full-stack development, and cloud-native automation.

**LinkedIn:** [https://www.linkedin.com/in/incharasrinivasa/](https://www.linkedin.com/in/incharasrinivasa/)
**Email:** [incharasrinivasa7@gmail.com](mailto:incharasrinivasa7@gmail.com)
