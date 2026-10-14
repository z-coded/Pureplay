# Chapter 3: Design and Architecture

## 3.1 System Architecture Overview

The system follows a highly scalable **Serverless Client-Server Architecture** for the current FYP-1 implementation, with a planned migration to a **Component-Based Layered Architecture with an Event-Driven Asynchronous Task Pattern** in FYP-2. In the current phase, the React.js frontend (SPA) communicates directly with Firebase services via official client SDKs. This architecture completely removes the need for a traditional middle-tier REST API for standard CRUD operations, relying instead on highly secure Firestore Security Rules to enforce authorization and business logic at the database edge.

The current system is divided into three operational layers: the **Presentation Layer** (React.js SPA), the **Service/Context Layer** (Firebase SDK abstraction via custom React Hooks), and the **Data/Persistence Layer** (Firebase Authentication, Cloud Firestore, and Cloud Storage). Each layer communicates through well-defined SDK interfaces to ensure separation of concerns and maintainability.

The frontend is responsible for all user interaction and is implemented using **React.js** with Vite as the build tool. It handles user authentication flows, video upload with real-time progress tracking, administrative dashboard rendering with live Firestore snapshot listeners, and flagged content review via modal-based video players. The backend is entirely managed by **Firebase's Backend-as-a-Service (BaaS)** platform, which provides identity management (Firebase Authentication), real-time document database (Cloud Firestore), and binary object storage (Cloud Storage).

For FYP-2, the architecture will be extended to include a **Python Flask/Django** backend API layer, **Celery + Redis** for asynchronous task orchestration, an **AI Processing Layer** (FFmpeg, NudeNet/OpenNSFW2, OpenAI Whisper, Detoxify), **MongoDB** for metadata storage, and **MinIO** for S3-compatible binary object storage. The current Firebase infrastructure serves as the functional prototype demonstrating the complete user workflow, while FYP-2 will introduce the full AI censorship intelligence pipeline.

Security is enforced at multiple levels in the current implementation. Authentication is handled natively by **Firebase Authentication**, which manages password hashing, session tokens, and identity verification. Database access is controlled through **Firestore Security Rules**, which validate the user's Auth UID and role attribute before permitting read/write operations. All client-server communication is encrypted via **HTTPS/TLS**.

### 3.1.1 Purpose

The purpose of this architecture is to provide a clear conceptual view of how PurePlay operates at a high level. It illustrates how guardian and administrator interactions flow through the React frontend, how requests are processed by Firebase services, how video metadata and binary files are stored and retrieved, and how the Admin Dashboard provides real-time moderation capabilities. This design establishes the foundational infrastructure upon which the AI censorship pipeline will be integrated in FYP-2.

> **[INSERT FIGURE 3.1: SYSTEM ARCHITECTURE DIAGRAM â€” PurePlay Platform (FYP-1 Scope)]**
> *Instructions: Draw a system architecture diagram showing: (1) React.js Frontend (SPA) at the top communicating via Firebase SDK calls to three Firebase services: Firebase Authentication (identity), Cloud Firestore (metadata), and Cloud Storage (video files). Show bidirectional arrows for real-time Firestore WebSocket listeners. Include a dashed boundary labeled "FYP-2 Planned Extension" containing: Flask/Django API, Celery + Redis, AI Processing modules (FFmpeg, NudeNet, Whisper, Detoxify), MongoDB, and MinIO. Annotate security mechanisms (Firebase Auth, Firestore Rules, Storage Rules, HTTPS) at relevant boundaries.*

---

## 3.2 Conceptual Architecture Diagram

**Table 3.1: Architecture Components and Security Mechanisms**

| Architecture Component | Description | Technology Used | Security Mechanism |
|---|---|---|---|
| Frontend Layer (Presentation) | User interface for video upload, Guardian Dashboard, Admin flagged-content review, and modal video player | React.js (SPA), Vite, Tailwind CSS | Input validation, secure Firebase SDK calls, client-side route guards |
| Authentication Service | Manages user registration, login, session persistence, and role-based access control | Firebase Authentication | Native password hashing (scrypt), secure session tokens, email verification |
| Metadata Database | Stores user documents (with role field), video metadata records (title, description, status, URLs), and real-time moderation logs | Firebase Cloud Firestore | Firestore Security Rules validating `request.auth.uid` and `role == 'admin'` before every read/write |
| Binary Object Storage | Stores raw uploaded video files (`.mp4`, `.webm`) with automatic CDN-backed download URLs | Firebase Cloud Storage | Storage Security Rules enforcing authentication, file size limits (max 100MB), MIME type restrictions (`video/*`) |
| Service/Context Layer | Custom React Hooks (`useAuth`, `useFirestore`, `useStorage`) abstracting Firebase SDK calls and managing async state | React Hooks, Firebase JS SDK v9+ | Scoped SDK initialization; no raw credential exposure in client code |
| Communication Layer | Handles all interaction between React frontend and Firebase services | Firebase SDK (WebSocket for Firestore, HTTPS for Storage/Auth) | TLS encryption, authenticated SDK sessions |
| **[FYP-2 Planned]** Backend API Layer | Will handle AI pipeline orchestration, advanced business logic, and REST endpoints | Python Flask/Django | JWT authentication, CORS, input validation |
| **[FYP-2 Planned]** Orchestration Layer | Will manage asynchronous AI analysis tasks | Celery + Redis | Task-level auth, signed messages |
| **[FYP-2 Planned]** AI Processing Layer | Will perform visual classification, speech-to-text, and toxicity analysis | NudeNet, OpenNSFW2, Whisper, Detoxify, FFmpeg | Sandboxed execution, model isolation |
| **[FYP-2 Planned]** Extended Data Layer | Will replace Firebase with self-hosted storage | MongoDB, MinIO | Document-level ACL, pre-signed URLs, SSE |

---

## 3.3 Architecture Style / Pattern

PurePlay (FYP-1) utilizes a **Backend-as-a-Service (BaaS) Pattern** implemented via the Firebase platform. This pattern was selected because it eliminates infrastructure management overhead, provides built-in authentication, real-time database synchronization, and scalable object storage â€” enabling the team to focus on frontend development and user workflow validation during the initial 30% implementation phase.

The architecture divides the current system into **three operational layers**, with two additional layers planned for FYP-2:

### Layer 1: Presentation Layer (Implemented â€” FYP-1)

This layer consists of the **React.js** frontend application delivered as a Single Page Application (SPA) built with Vite. It is responsible for all user interaction including:

- Guardian and Administrator registration and login screens
- Video upload portal with drag-and-drop file selection and real-time progress bars
- Admin Dashboard displaying aggregated metrics (Total Uploads, Flagged Count, Approved Count)
- Flagged content queue with sortable video list and status badges (Green=Approved, Red=Flagged, Yellow=Pending)
- Modal-based sandboxed video player for safe administrative content review
- Manual override controls (Approve/Delete) with instant Firestore updates

The Presentation Layer communicates exclusively with Firebase services through the official JavaScript SDK, never accessing databases or storage directly without SDK mediation.

### Layer 2: Service/Context Layer (Implemented â€” FYP-1)

This layer is implemented as **custom React Hooks and Context Providers** that abstract Firebase SDK interactions:

- `useAuth` â€” Manages authentication state, login/logout flows, and role detection
- `useFirestore` â€” Wraps Firestore queries, real-time snapshot listeners, and document CRUD operations
- `useStorage` â€” Handles file upload with progress tracking and download URL generation

This layer provides a clean separation between UI components and data access logic, ensuring that Firebase implementation details do not leak into presentation components.

### Layer 3: Data/Persistence Layer (Implemented â€” FYP-1)

This layer is fully managed by **Firebase's cloud infrastructure**:

- **Firebase Authentication** â€” Handles identity management, password hashing (using scrypt), session tokens, and user lifecycle
- **Cloud Firestore** â€” NoSQL document database providing real-time WebSocket synchronization for user metadata, video records, and moderation status
- **Cloud Storage** â€” Binary object storage optimized for large video files with automatic CDN-backed download URLs

### Layer 4: API Gateway Layer (Planned â€” FYP-2)

This layer will be implemented using **Python Flask/Django** in FYP-2. It will handle HTTP request routing, input validation, JWT-based authentication, and dispatching of asynchronous AI analysis tasks to the Orchestration Layer. It will serve as the single entry point and security boundary between the client and the AI processing infrastructure.

### Layer 5: AI Processing & Orchestration Layer (Planned â€” FYP-2)

This layer will be built upon **Celery + Redis** for task orchestration and will contain the core AI intelligence:

- **FFmpeg** â€” Frame extraction and audio demuxing
- **NudeNet / OpenNSFW2** â€” Visual content classification (CNN-based)
- **OpenAI Whisper** â€” Speech-to-text transcription
- **Detoxify** â€” NLP toxicity classification

### Justification for the Chosen Architecture

This architecture was chosen because:

- **Rapid Prototyping:** Firebase BaaS allowed the team to deliver a fully functional video upload-to-review pipeline within the FYP-1 timeline without managing servers, databases, or authentication infrastructure
- **Real-Time Synchronization:** Firestore's WebSocket listeners enable the Admin Dashboard to reflect video status changes instantly without manual polling or page refresh
- **Security Without Custom Code:** Firebase Authentication and Firestore Security Rules enforce RBAC and data isolation natively, eliminating common security vulnerabilities from custom implementations
- **Clear Migration Path:** The React frontend is completely decoupled from Firebase via the Hook abstraction layer, enabling a clean migration to Flask/Django + MongoDB + MinIO in FYP-2 without rewriting UI components

### Evidence from Related Systems

| Related System | Architecture Used | PurePlay Adaptation |
|---|---|---|
| YouTube Content Moderation | Distributed microservices with ML pipelines | PurePlay's FYP-1 establishes the user-facing workflow; FYP-2 will add the ML pipeline |
| AWS Rekognition + S3 | Cloud-native serverless with event triggers | PurePlay mirrors the event-driven pattern using Firebase triggers (FYP-1) and Celery (FYP-2) |
| Microsoft Azure Content Moderator | Layered API with async batch processing | PurePlay follows the same layered pattern, with Firebase as the current service layer |

### Component Interaction

In the current FYP-1 implementation, the React frontend communicates directly with Firebase services via the SDK. When a user uploads a video, the React component calls `uploadBytesResumable()` to stream the file to Cloud Storage, then `setDoc()` to write metadata to Firestore with `status: "Pending"`. The Admin Dashboard uses `onSnapshot()` listeners to receive real-time updates. When an admin approves or deletes a video, `updateDoc()` or `deleteDoc()` is called, and all connected clients receive the update via WebSocket.

> **[INSERT FIGURE 3.2: LAYERED ARCHITECTURE DIAGRAM â€” PurePlay System (FYP-1: Layers 1â€“3, FYP-2: Layers 4â€“5)]**
> *Instructions: Draw a horizontal layered diagram. Layers 1â€“3 should be drawn with solid borders (implemented). Layers 4â€“5 should be drawn with dashed borders (planned for FYP-2). Layer 1: React.js Components. Layer 2: Custom React Hooks (useAuth, useFirestore, useStorage). Layer 3: Firebase Services (Auth, Firestore, Storage). Layer 4 (dashed): Flask/Django API. Layer 5 (dashed): Celery + Redis, AI Modules, MongoDB, MinIO.*

---

## 3.4 Design Models

This section presents the design models used in the PurePlay system. The system follows an **object-oriented development approach** supported by component-based React patterns. These models represent the structure, behavior, and interaction of system components **as implemented in FYP-1**.

The design models focus only on **core workflows and critical system processes**, excluding trivial operations such as basic password recovery or profile field edits.

### 3.4.1 Design Models for Object-Oriented Development Approach

#### 1. Activity Diagram

The activity diagrams represent the workflows of the PurePlay video upload and administrative moderation pipeline as implemented in FYP-1.

> **[INSERT FIGURE 3.3: ACTIVITY DIAGRAM â€” Video Upload & Storage Pipeline]**
> *Instructions: Draw an activity diagram starting with the User selecting a video file. Flow: (1) User selects file via drag-and-drop â†’ (2) React validates MIME type (video/mp4, video/webm) and file size (â‰¤100MB) â†’ (3) Decision: valid? â†’ If No: display error â†’ If Yes: (4) Call uploadBytesResumable() to Firebase Storage â†’ (5) Progress bar updates in real-time â†’ (6) On 100% completion, getDownloadURL() invoked â†’ (7) setDoc() writes metadata to Firestore (status: "Pending") â†’ (8) Success toast displayed â†’ (9) Video appears in Dashboard. Include swim lanes for User, React Frontend, Firebase Storage, and Firestore.*

> **[INSERT FIGURE 3.4: ACTIVITY DIAGRAM â€” Admin Flagged Content Review & Override]**
> *Instructions: Draw an activity diagram: (1) Admin navigates to Dashboard â†’ (2) Firestore onSnapshot() loads video list â†’ (3) Admin selects video with status "Flagged" â†’ (4) Modal opens with sandboxed video player â†’ (5) Admin watches video â†’ (6) Decision: Approve or Delete? â†’ If Approve: updateDoc(status: "Approved") â†’ video moves to Approved gallery â†’ If Delete: deleteDoc() + deleteObject() from Storage â†’ video permanently removed â†’ (7) Dashboard refreshes via snapshot listener.*

> **[INSERT FIGURE 3.5: ACTIVITY DIAGRAM â€” User Authentication Flow]**
> *Instructions: Draw an activity diagram: (1) User opens app â†’ (2) Check auth state â†’ (3) Decision: authenticated? â†’ If Yes: redirect to Dashboard â†’ If No: display Login screen â†’ (4) User enters credentials â†’ (5) signInWithEmailAndPassword() â†’ (6) Decision: valid? â†’ If No: display error â†’ If Yes: (7) Check Firestore user document for role â†’ (8) Decision: role == "admin"? â†’ If Yes: redirect to Admin Dashboard â†’ If No: redirect to User Upload Portal.*

#### 2. Class Diagram

The class diagram presents the object-oriented structure of the FYP-1 implementation, showing **data model entities** (Firestore documents) and **service classes** (React Hook abstractions).

> **[INSERT FIGURE 3.6: CLASS DIAGRAM â€” FYP-1 System Models and Services]**
> *Instructions: Draw a UML class diagram including:*
>
> **Data Model Classes (Firestore Documents):**
> - `User` â€” `{uid, email, role, display_name, created_at}`
> - `Video` â€” `{video_id, user_id, title, description, storage_url, download_url, status, file_size, mime_type, uploaded_at}`
>
> **Service/Hook Classes:**
> - `AuthService (useAuth)` â€” `register(), login(), logout(), getCurrentUser(), getRole()`
> - `FirestoreService (useFirestore)` â€” `addDocument(), updateDocument(), deleteDocument(), getCollection(), onSnapshot()`
> - `StorageService (useStorage)` â€” `uploadFile(), getDownloadURL(), deleteFile(), onProgress()`
> - `DashboardService` â€” `getMetrics(), getFlaggedVideos(), getApprovedVideos()`
>
> *Show relationships: User 1â†’* Video. Show service dependencies with dashed arrows.*

#### 3. Sequence Diagrams

**Sequence Diagram 1: User Registration and Authentication Flow**

> **[INSERT FIGURE 3.7: SEQUENCE DIAGRAM â€” User Registration & Login Flow]**
> *Instructions: Draw a sequence diagram with actors/objects: User, React Frontend, Firebase Auth, Firestore. Show: (1) User fills registration form â†’ (2) Frontend validates input â†’ (3) createUserWithEmailAndPassword(email, password) â†’ (4) Firebase Auth creates user, returns uid â†’ (5) Frontend calls setDoc() on Firestore "users" collection: {uid, email, role: "user", created_at} â†’ (6) Return success, redirect to Upload Portal. Then Login flow: (7) signInWithEmailAndPassword() â†’ (8) Firebase Auth validates â†’ (9) Returns user object with uid â†’ (10) Frontend queries Firestore "users/{uid}" for role â†’ (11) If role == "admin": redirect to Admin Dashboard, else: redirect to Upload Portal.*

**Sequence Diagram 2: Video Upload Flow**

> **[INSERT FIGURE 3.8: SEQUENCE DIAGRAM â€” Video Upload & Firestore Binding]**
> *Instructions: Draw a sequence diagram with: User, React Frontend, Firebase Storage, Firestore. Show: (1) User selects video file and enters title/description â†’ (2) Frontend validates MIME type and size â†’ (3) uploadBytesResumable(storageRef, file) â†’ (4) Storage sends progress events â†’ (5) Frontend updates progress bar state â†’ (6) On 100%: getDownloadURL() â†’ (7) Storage returns signed URL â†’ (8) Frontend calls setDoc() to Firestore "videos" collection: {user_id, title, description, storage_url, download_url, status: "Pending", uploaded_at} â†’ (9) Firestore confirms write â†’ (10) Frontend shows success toast and refreshes gallery.*

**Sequence Diagram 3: Admin Dashboard â€” Real-Time Moderation Flow**

> **[INSERT FIGURE 3.9: SEQUENCE DIAGRAM â€” Admin Dashboard & Override Flow]**
> *Instructions: Draw a sequence diagram with: Admin, React Frontend, Firestore, Firebase Storage. Show: (1) Admin navigates to /admin â†’ (2) Frontend checks role from auth context â†’ (3) If role != "admin": redirect to Home â†’ (4) If admin: onSnapshot("videos") establishes real-time listener â†’ (5) Firestore streams current video documents â†’ (6) Frontend renders dashboard with metrics and video table â†’ (7) Admin clicks flagged video â†’ (8) Modal opens, loads video via download_url â†’ (9) Admin clicks "Approve" â†’ (10) updateDoc({status: "Approved"}) â†’ (11) Firestore triggers snapshot update â†’ (12) All connected Admin dashboards re-render automatically. Alt: Admin clicks "Delete" â†’ deleteDoc() from Firestore + deleteObject() from Storage.*

#### 4. State Transition Diagram

The state machine diagram models the lifecycle of a **Video Record** as implemented in the FYP-1 system.

> **[INSERT FIGURE 3.10: STATE MACHINE DIAGRAM â€” Video Moderation Lifecycle (FYP-1)]**
> *Instructions: Draw a UML state machine diagram with the following states and transitions:*
> - **Initial State [â—]** â†’ `Uploading` (trigger: user initiates upload)
> - `Uploading` â†’ `Pending` (trigger: file stored in Storage, metadata written to Firestore)
> - `Uploading` â†’ `Upload Failed` (trigger: network error or size limit exceeded)
> - `Upload Failed` â†’ **Final State [â—]** (trigger: user dismisses error)
> - `Pending` â†’ `Approved` (trigger: Admin clicks "Approve" in dashboard â€” *Note: In FYP-1, manual admin action; in FYP-2, AI pipeline will auto-assign*)
> - `Pending` â†’ `Flagged` (trigger: Admin manually flags â€” *Note: In FYP-2, AI will auto-flag*)
> - `Flagged` â†’ `Approved` (trigger: Admin overrides and approves)
> - `Flagged` â†’ `Deleted` (trigger: Admin rejects and deletes)
> - `Approved` â†’ `Published` (trigger: video visible in public gallery)
> - `Deleted` â†’ **Final State [â—]** (trigger: video removed from Storage and Firestore)
> *Add a note: "FYP-2 will add states: Processing, Analyzing_Visual, Analyzing_Audio, Aggregating, Failed"*

---

## 3.5 Data Design

The FYP-1 system employs a highly **denormalized NoSQL document structure** implemented in **Firebase Cloud Firestore**, optimized for rapid read operations and real-time WebSocket synchronization. Binary video files are stored in **Firebase Cloud Storage** with CDN-backed download URLs.

### 3.5.1 Data Transformation and Organization

In the current FYP-1 implementation, data flows through a simplified pipeline:

1. **User Registration:** Firebase Auth creates an identity record; a supplementary user document is written to Firestore containing the role attribute and display name.
2. **Video Upload:** The binary video file is streamed to Firebase Cloud Storage via chunked upload. Upon completion, a download URL is generated and a metadata document is created in Firestore with status "Pending".
3. **Admin Review:** Administrators query Firestore for video documents, filter by status, and perform manual approve/delete actions that update the document state in real-time.
4. **Real-Time Sync:** All connected Admin Dashboard clients receive instant updates via Firestore WebSocket snapshot listeners whenever any video document is created, modified, or deleted.

In FYP-2, this pipeline will be extended with: FFmpeg frame extraction, NudeNet/OpenNSFW2 visual classification, Whisper audio transcription, Detoxify toxicity analysis, and XAI timeline event generation.

### 3.5.2 Databases and Data Storage Items

> **[INSERT FIGURE 3.11: ENTITY RELATIONSHIP DIAGRAM (ERD) â€” FYP-1]**
> *Instructions: Draw an ERD showing two Firestore collections and their relationship. Use crow's-foot notation. Show: Users (1â†’*) Videos. Include key fields in each entity box. Add a dashed section showing planned FYP-2 entities: ChildProfiles, AnalysisResults, XAITimelineEvents, AuditLogs.*

### 3.5.3 Key Data Entities Table

**Table 3.2: Database Entities and Data Structures (FYP-1 Implemented)**

| Entity | Description | Storage Type | Relationships | Key Fields |
|---|---|---|---|---|
| Users | Stores registered user accounts with role attribute for RBAC | Firebase Auth + Firestore Collection `users` | One-to-many with Videos | `uid`, `email`, `role` (user/admin), `display_name`, `created_at` |
| Videos | Stores video metadata linked to uploaded binary files in Storage | Firestore Collection `videos` | Many-to-one with Users | `video_id`, `user_id`, `title`, `description`, `storage_url`, `download_url`, `status` (Pending/Approved/Flagged), `file_size`, `mime_type`, `uploaded_at` |
| Video Files (Binary) | Raw uploaded video binary files | Firebase Cloud Storage (bucket) | Linked via `storage_url` in Videos collection | Object path, content type, size, generation, download URL |

**Table 3.3: Planned FYP-2 Data Entities**

| Entity | Description | Planned Storage | Key Fields |
|---|---|---|---|
| ChildProfiles | Child information with age-based sensitivity thresholds | MongoDB | `_id`, `guardian_id`, `name`, `date_of_birth`, `sensitivity_level`, `custom_thresholds` |
| AnalysisResults | Complete AI pipeline output per video | MongoDB | `_id`, `video_id`, `visual_scores[]`, `audio_transcript`, `toxicity_scores[]`, `aggregate_score`, `flagged_categories[]` |
| XAITimelineEvents | Frame-level explainability events | MongoDB | `_id`, `video_id`, `timestamp_seconds`, `event_type`, `confidence`, `frame_url` |
| AuditLogs | Administrative override action records | MongoDB | `_id`, `admin_id`, `video_id`, `action`, `previous_status`, `new_status` |

**Table 3.4: Data Storage Systems and Access Patterns (FYP-1)**

| Storage System | Purpose | Data Stored | Access Pattern / Security |
|---|---|---|---|
| Firebase Authentication | Identity management | User credentials (email, hashed password) | Managed by Firebase; scrypt hashing; no direct access to credentials |
| Cloud Firestore | Document metadata store | User profiles, video records with status | Security Rules: `allow read, write: if request.auth != null`; Admin rules: `if get(/users/{uid}).data.role == 'admin'` |
| Cloud Storage | Binary object storage | Raw video `.mp4` / `.webm` files | Storage Rules: `allow write: if request.auth != null && request.resource.size < 100 * 1024 * 1024 && request.resource.contentType.matches('video/.*')` |
# Chapter 4: Implementation

This chapter discusses the implementation details of the PurePlay project. It documents the core module functionalities using pseudocode, security techniques, Firebase service integration details, user interface descriptions, and system deployment information. **The implementation covers Modules 1â€“3 only:** User Authentication and Onboarding, Secure Video Intake Pipeline, and Administrative Insight Dashboard. The AI Censorship Pipeline, XAI Timeline, Child Profiles, and Docker containerization are scoped for FYP-2.

---

## 4.1 Project Methodology & Algorithms

### 4.1.1 Project Methodology (Step-by-Step Agile Approach)

The project was executed using an **iterative Agile methodology** organized into three development sprints for FYP-1, each lasting two weeks. The Agile approach was selected to enable rapid prototyping of the user-facing workflow before investing in the computationally intensive AI pipeline.

**Sprint 1 â€” Foundation & Authentication (Weeks 1â€“2):**
1. Project scaffolding: React.js frontend initialized with Vite, Tailwind CSS configured, Firebase project created and SDK integrated.
2. User authentication implemented using Firebase Authentication with `createUserWithEmailAndPassword()` and `signInWithEmailAndPassword()`.
3. Firestore user document creation upon registration, storing `uid`, `email`, `role`, `display_name`, and `created_at`.
4. Role-based access control (RBAC) implemented by reading the `role` field from the Firestore user document and conditionally rendering Admin vs. Standard User interfaces.
5. Protected routes implemented using React Router with an `AuthGuard` component that redirects unauthenticated users to the login screen.
6. Session persistence using Firebase's `onAuthStateChanged()` listener for seamless page reload authentication.

**Sprint 2 â€” Video Intake Pipeline (Weeks 3â€“4):**
1. Video upload interface implemented with drag-and-drop zone using `react-dropzone` and file-type validation (`.mp4`, `.webm` only).
2. File size validation enforced at the client level (max 100MB) with inline error messages.
3. Chunked file upload to Firebase Cloud Storage using `uploadBytesResumable()` with real-time progress tracking via task observer.
4. Upon upload completion, `getDownloadURL()` is invoked to obtain the CDN-backed signed URL.
5. Metadata document created in Firestore `videos` collection containing: `user_id`, `title`, `description`, `storage_url`, `download_url`, `status: "Pending"`, `file_size`, `mime_type`, `uploaded_at`.
6. Success toast notification displayed and video gallery re-rendered via Firestore snapshot listener.

**Sprint 3 â€” Admin Dashboard & Review System (Weeks 5â€“6):**
1. Admin Dashboard implemented with three KPI summary cards: Total Uploads, Flagged Videos, Approved Videos, computed via Firestore aggregation queries.
2. Video history table rendered with sortable columns (title, status, date) and color-coded status badges: Green (Approved), Red (Flagged), Yellow (Pending).
3. Real-time Firestore `onSnapshot()` listeners established to provide instant dashboard updates when any video document is created, modified, or deleted.
4. Modal-based video player implemented for safe administrative content review, loading video via the Firebase Storage download URL.
5. Manual override controls: "Approve" button calls `updateDoc({status: "Approved"})`, "Delete" button calls `deleteDoc()` on Firestore and `deleteObject()` on Storage.
6. Route protection: Standard users attempting to navigate to `/admin` are intercepted by the `AdminGuard` component and redirected to the home page.

### 4.1.2 Algorithm

**Table 4.1: Details of Algorithms Used in the Project (FYP-1)**

| Algorithm Name | Details |
|---|---|
| **Video Upload & Storage Algorithm** | **Input:** Video file (binary), metadata (title, description) |
| | **Output:** Stored video record with status "Pending" |
| | **Pseudocode:** |
| | `1: User authenticates via Firebase Auth. System returns uid.` |
| | `2: User selects video file. React validates MIME type âˆˆ {video/mp4, video/webm}.` |
| | `3: React validates file.size â‰¤ 100MB.` |
| | `4: IF validation fails â†’ display inline error â†’ ABORT.` |
| | `5: storageRef = ref(storage, "videos/" + uid + "/" + timestamp + "_" + filename)` |
| | `6: uploadTask = uploadBytesResumable(storageRef, file)` |
| | `7: uploadTask.on("state_changed", (snapshot) â†’ update progress bar state)` |
| | `8: ON 100% completion â†’ downloadURL = await getDownloadURL(uploadTask.snapshot.ref)` |
| | `9: await setDoc(doc(firestore, "videos", auto_id), {` |
| | `     user_id: uid, title, description, storage_url: storageRef.fullPath,` |
| | `     download_url: downloadURL, status: "Pending",` |
| | `     file_size: file.size, mime_type: file.type, uploaded_at: serverTimestamp()` |
| | `   })` |
| | `10: Display success toast. Refresh video gallery via snapshot listener.` |
| **Admin Override Algorithm** | **Input:** video_id, action (approve/delete), admin_uid |
| | **Output:** Updated video status or deleted record |
| | **Pseudocode:** |
| | `1: Verify current user role == "admin" from Firestore user document.` |
| | `2: IF action == "approve":` |
| | `3:   await updateDoc(doc(firestore, "videos", video_id), {status: "Approved"})` |
| | `4: ELSE IF action == "delete":` |
| | `5:   videoDoc = await getDoc(doc(firestore, "videos", video_id))` |
| | `6:   await deleteObject(ref(storage, videoDoc.storage_url))` |
| | `7:   await deleteDoc(doc(firestore, "videos", video_id))` |
| | `8: Dashboard auto-refreshes via onSnapshot() listener.` |
| **Role-Based Route Guard Algorithm** | **Input:** Target route path, current user auth state |
| | **Output:** Allowed navigation or redirect |
| | **Pseudocode:** |
| | `1: onAuthStateChanged(auth, (user) â†’ {` |
| | `2:   IF user == null â†’ redirect to /login` |
| | `3:   ELSE â†’ fetch Firestore document users/{user.uid}` |
| | `4:   IF targetRoute requires admin AND userDoc.role != "admin":` |
| | `5:     redirect to /home` |
| | `6:   ELSE â†’ allow navigation` |
| | `7: })` |

---

## 4.2 Training Results & Model Evaluation

The FYP-1 implementation does not include AI model integration. The current system relies on **manual administrative review** for content moderation. AI model integration (NudeNet/OpenNSFW2, OpenAI Whisper, Detoxify) is planned for FYP-2, at which point model evaluation metrics (accuracy, precision, recall, F1-score) will be documented.

**FYP-1 Evaluation Focus:**
- **Upload Pipeline Reliability:** 100% of valid video uploads successfully stored in Firebase Storage with corresponding Firestore metadata documents.
- **Real-Time Sync Latency:** Firestore snapshot updates propagate to connected Admin Dashboard clients within < 2 seconds.
- **RBAC Enforcement:** 100% of unauthorized route access attempts correctly intercepted and redirected.

---

## 4.3 Security Techniques

### 4.3.1 Authentication & Authorization

- **Password Management:** All password hashing is handled natively by **Firebase Authentication** using the scrypt algorithm. Plaintext passwords are never stored, transmitted after initial receipt, or accessible to the application code.
- **Session Management:** Firebase Auth manages session persistence using secure tokens. The `onAuthStateChanged()` listener automatically detects session state changes (login, logout, token expiry) and updates the React application state accordingly.
- **Role-Based Access Control (RBAC):** Two roles are enforced: `user` (standard) and `admin` (administrator). The role is stored in the Firestore `users` collection and checked on every admin route navigation. Admin-only UI elements are conditionally rendered based on the role.

### 4.3.2 Data Encryption & Privacy

- **Data in Transit:** All communication between the React frontend and Firebase services is encrypted via **HTTPS/TLS**, enforced by Firebase's global infrastructure.
- **Data at Rest:** Firebase encrypts all stored data (Firestore documents and Cloud Storage objects) at rest using AES-256 encryption, managed transparently by Google Cloud infrastructure.
- **No PII Exposure:** Video download URLs are signed and time-limited. Direct Storage bucket access is blocked by security rules.

### 4.3.3 Attack Prevention

- **Firestore Security Rules:** Enforce authentication before any read/write operation:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /videos/{videoId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
  }
  ```
- **Storage Security Rules:** Enforce file type and size restrictions:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /videos/{userId}/{allPaths=**} {
        allow read: if request.auth != null;
        allow write: if request.auth != null
          && request.auth.uid == userId
          && request.resource.size < 100 * 1024 * 1024
          && request.resource.contentType.matches('video/.*');
      }
    }
  }
  ```
- **Client-Side Input Validation:** React components validate all form inputs (email format, password length, file type, file size) before submitting to Firebase, providing immediate user feedback.
- **Route Protection:** React Router guards prevent unauthorized navigation. The `AdminGuard` component checks Firestore role before rendering admin pages.

---

## 4.4 External APIs / SDKs

PurePlay FYP-1 utilizes the **Firebase platform** as its primary external service. No additional cloud APIs are used in the current implementation.

**Table 4.2: Details of APIs/SDKs Used in the Project (FYP-1)**

| Name & Version | Description | Purpose of Usage | Function/Class Used |
|---|---|---|---|
| Firebase Authentication (v9+) | Identity management service | User registration, login, logout, session persistence, and auth state observation | `createUserWithEmailAndPassword()`, `signInWithEmailAndPassword()`, `signOut()`, `onAuthStateChanged()` in `hooks/useAuth.js` |
| Firebase Cloud Firestore (v9+) | NoSQL document database | Stores user profiles with role, video metadata with status, real-time dashboard synchronization | `setDoc()`, `getDoc()`, `updateDoc()`, `deleteDoc()`, `collection()`, `query()`, `onSnapshot()` in `hooks/useFirestore.js` |
| Firebase Cloud Storage (v9+) | Binary object storage | Stores uploaded video files, generates download URLs, supports chunked uploads with progress | `uploadBytesResumable()`, `getDownloadURL()`, `deleteObject()`, `ref()` in `hooks/useStorage.js` |
| React.js (v18+) | Frontend UI library | Component-based SPA development, state management, virtual DOM rendering | Functional components, `useState()`, `useEffect()`, `useContext()` across all UI components |
| Vite (v5+) | Frontend build tool | Fast development server with HMR, optimized production builds | `vite.config.js` configuration |
| Tailwind CSS (v3+) | Utility-first CSS framework | Responsive, modern UI styling with dark theme and glassmorphism effects | Utility classes across all `.jsx` component files |
| React Router (v6+) | Client-side routing library | SPA navigation, protected route guards, role-based redirects | `BrowserRouter`, `Routes`, `Route`, `Navigate` in `App.jsx` |

---

## 4.5 User Interface

The UI was constructed using **React.js with Tailwind CSS** to guarantee responsive, accessible, and visually polished layouts. The design features a dark-themed color palette with gradient accent elements, glassmorphism card effects, and smooth hover transitions.

### 4.5.1 Login Screen

The login screen features a centered card on a dark gradient background with the PurePlay logo, an email input field, a password input field with show/hide toggle, a "Sign In" button, and a "Create Account" link. Inline validation errors appear in red below the respective field upon invalid submission.

> **[INSERT FIGURE 4.1: SCREENSHOT â€” PurePlay Login Screen]**
> *Instructions: Capture a screenshot of the running PurePlay login page showing the email and password fields, "Sign In" button, and "Create Account" link with the PurePlay branded header.*

### 4.5.2 Registration Screen

The registration screen extends the login layout with additional fields: display name, email, password, and confirm password. Password complexity requirements are displayed below the field. Upon successful registration, the user is automatically redirected to the upload portal.

> **[INSERT FIGURE 4.2: SCREENSHOT â€” PurePlay Registration Screen]**
> *Instructions: Capture a screenshot of the registration page showing all input fields, inline validation indicators, and the "Register" button.*

### 4.5.3 Video Upload Portal

The upload portal features a prominent drag-and-drop zone with dashed borders and a file-type hint ("MP4 or WebM, max 100MB"). Below the drop zone are text fields for video title and description. A child-profile selector dropdown is provided (placeholder for FYP-2 integration). During upload, a progress bar fills in real-time with percentage text. Upon completion, a success toast appears.

> **[INSERT FIGURE 4.3: SCREENSHOT â€” PurePlay Video Upload Portal]**
> *Instructions: Capture a screenshot of the upload page showing the drag-and-drop zone, title/description fields, and (if possible) the progress bar during an active upload.*

### 4.5.4 Admin Dashboard

The Admin Dashboard displays three metric cards at the top (Total Uploads, Flagged, Approved) with animated count-up numbers. Below is a video history table with columns: Title, Uploader, Status (color-coded badge), Date, and Actions (View/Approve/Delete buttons). A sidebar navigation provides links to Dashboard, Upload, and Gallery.

> **[INSERT FIGURE 4.4: SCREENSHOT â€” PurePlay Admin Dashboard]**
> *Instructions: Capture a screenshot of the Admin Dashboard showing the metric cards, video table with at least 3â€“4 entries showing different statuses (Pending/Approved/Flagged), and the sidebar navigation.*

### 4.5.5 Modal Video Review

When an admin clicks "View" on a video entry, a full-screen modal opens containing a sandboxed HTML5 video player with standard playback controls (play/pause, seek, volume, fullscreen). Below the player, the video metadata (title, description, uploader, upload date) is displayed. Two action buttons â€” "Approve" (green) and "Delete" (red) â€” are positioned at the bottom of the modal.

> **[INSERT FIGURE 4.5: SCREENSHOT â€” PurePlay Modal Video Review]**
> *Instructions: Capture a screenshot of the modal overlay showing the video player, metadata display, and Approve/Delete action buttons.*

---

## 4.6 Deployment

The FYP-1 system is deployed in a **local development environment** for demonstration. The frontend runs on the Vite development server, while all backend services are hosted on Firebase's globally distributed cloud infrastructure.

**Local Development Setup:**
1. `npm install` installs all frontend dependencies (React, Firebase SDK, Tailwind CSS, React Router).
2. Firebase project configuration is stored in `.env` file with API keys and project identifiers.
3. `npm run dev` starts the Vite development server at `localhost:5173` with Hot Module Replacement (HMR).
4. Firebase services (Auth, Firestore, Storage) are accessed directly via the SDK â€” no local backend server is required.
5. Firestore Security Rules and Storage Security Rules are deployed via `firebase deploy --only firestore:rules,storage` to enforce server-side authorization.

**FYP-2 Deployment Plan:**
In FYP-2, the system will be migrated to a **Docker Compose** setup with six containers:
- `pureplay-frontend` (React + Nginx)
- `pureplay-backend` (Flask/Django + Gunicorn)
- `pureplay-worker` (Celery + AI models + FFmpeg)
- `pureplay-redis` (message broker)
- `pureplay-mongodb` (metadata database)
- `pureplay-minio` (S3-compatible object storage)

This containerization will enable the full AI censorship pipeline to run as an independent, horizontally scalable worker process.
# Chapter 5: Testing and Evaluation

Once the system has been successfully developed, testing has to be conducted to ensure that the system works as intended. This is also to check that the system meets the requirements stated in Chapter 2. Besides that, system testing will help in finding the errors that may be hidden from the user. The testing must be completed before it is deployed for use.

There are four types of testing which include unit testing, functional testing, business rules testing and integration testing. **For FYP-1, testing covers the three implemented modules only:** User Authentication and Onboarding (M1), Secure Video Intake Pipeline (M2), and Administrative Insight Dashboard (M3). AI censorship pipeline testing will be documented in FYP-2.

---

## 5.1 Unit Testing

Unit testing verifies the smallest testable components of the software (e.g., individual functions, methods, or React components) in isolation. The purpose is to ensure that each unit performs as expected, independent of the full system.

### Unit Testing 1: `VideoCard` Component Rendering with Status Props

**Testing Objective:** To ensure the VideoCard React component correctly renders different status badges and icons based on the `status` prop value.

**Table 5.1: Unit Test 1 â€” `VideoCard` Component**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Render `VideoCard` component with "Approved" status props | `status = "Approved"` | Component displays Green badge with checkmark icon and "Approved" label | Displayed Green badge | Pass |
| 2 | Render `VideoCard` component with "Flagged" status props | `status = "Flagged"` | Component displays Red badge with warning icon and "Flagged" label | Displayed Red badge | Pass |
| 3 | Render `VideoCard` component with "Pending" status props | `status = "Pending"` | Component displays Yellow badge with clock icon and "Pending" label | Displayed Yellow badge | Pass |

### Unit Testing 2: `formatDate()` Utility Function

**Testing Objective:** To ensure the date formatting utility correctly converts Firestore Timestamp objects and raw UNIX timestamps into human-readable date strings.

**Table 5.2: Unit Test 2 â€” `formatDate()`**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Call `formatDate()` with valid Firestore Timestamp | `Timestamp(1697107200, 0)` (Oct 12, 2023) | Returns `"Oct 12, 2023"` | `"Oct 12, 2023"` | Pass |
| 2 | Call `formatDate()` with null value | `null` | Returns `"N/A"` or empty string without crashing | `"N/A"` returned | Pass |
| 3 | Call `formatDate()` with current timestamp | `Date.now()` | Returns today's date in "MMM DD, YYYY" format | Correct format returned | Pass |

### Unit Testing 3: `validateEmail()` Utility Function

**Testing Objective:** To ensure the email validation function correctly identifies valid and invalid email formats before submission to Firebase Auth.

**Table 5.3: Unit Test 3 â€” `validateEmail()`**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Call `validateEmail()` with valid email | `"user@gmail.com"` | Returns `True` | `True` | Pass |
| 2 | Call `validateEmail()` with invalid email (missing @) | `"user.gmail.com"` | Returns `False` | `False` | Pass |
| 3 | Call `validateEmail()` with empty string | `""` | Returns `False` | `False` | Pass |
| 4 | Call `validateEmail()` with email missing domain | `"user@"` | Returns `False` | `False` | Pass |

### Unit Testing 4: `validateVideoFile()` â€” File Type and Size Validation

**Testing Objective:** To ensure the video file validation function correctly accepts valid video MIME types within the size limit and rejects invalid files before initiating Firebase Storage upload.

**Table 5.4: Unit Test 4 â€” `validateVideoFile()`**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Call with valid `.mp4` under size limit | `type: "video/mp4"`, `size: 50MB` | Returns `True` | `True` | Pass |
| 2 | Call with `.exe` file | `type: "application/x-msdownload"`, `size: 10MB` | Returns `False` with error "Invalid file type" | `False`, error returned | Pass |
| 3 | Call with `.mp4` exceeding 100MB limit | `type: "video/mp4"`, `size: 150MB` | Returns `False` with error "File exceeds maximum size" | `False`, error returned | Pass |
| 4 | Call with null file | `file = null` | Returns `False` with error "No file selected" | `False`, error returned | Pass |

---

## 5.2 Functional Testing

Functional testing validates that the system modules work correctly as a whole, ensuring that the developed system meets its specifications and requirements. Unlike unit testing, which focuses on internal functions, functional testing evaluates user-facing features through the React UI.

### Functional Testing 1: User Registration with Valid and Invalid Inputs

**Objective:** To ensure that a new account is created when all inputs are valid and that appropriate errors are shown when registration rules are violated.

**Table 5.5: Functional Testing 1 â€” User Registration**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Register with all valid inputs | Email: ali@gmail.com, Password: Secure@1234 | Account created in Firebase Auth; user document written to Firestore; user redirected to Upload Portal | Account created successfully | Pass |
| 2 | Register with duplicate email | Email already exists in Firebase Auth | Error: "Email already in use" displayed | Error message displayed | Pass |
| 3 | Register with password below 6 characters | Password: "abc" | Error: "Password must be at least 6 characters" displayed | Error message displayed | Pass |
| 4 | Register with invalid email format | Email: "invalid-email" | Error: "Invalid email format" displayed | Error message displayed | Pass |

### Functional Testing 2: User Login with Valid and Invalid Credentials

**Objective:** To ensure that the correct dashboard is loaded for authenticated users based on their role and that invalid login attempts are rejected with an error message.

**Table 5.6: Functional Testing 2 â€” User Login**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Login with valid user credentials | Email: user@gmail.com, Password: Secure@1234 | User authenticated; redirected to Upload Portal | Dashboard displayed successfully | Pass |
| 2 | Login with valid admin credentials | Email: admin@pureplay.com, Password: Admin@1234 | User authenticated; redirected to Admin Dashboard | Admin Dashboard displayed | Pass |
| 3 | Login with wrong password | Email: user@gmail.com, Password: wrongpass | Error: "Invalid credentials" displayed; access denied | Error message displayed | Pass |
| 4 | Login with unregistered email | Email: unknown@test.com, Password: Test@1234 | Error: "Account not found" displayed | Error message displayed | Pass |

### Functional Testing 3: Video Upload with Valid and Invalid Files

**Objective:** To ensure that videos are successfully uploaded to Firebase Storage and metadata is written to Firestore when all inputs are valid, and that validation errors are shown for invalid files.

**Table 5.7: Functional Testing 3 â€” Video Upload**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Upload valid `.mp4` under size limit with metadata | Title: "Cartoon Episode", Description: "Safe content", File: 50MB `.mp4` | Progress bar reaches 100%; success toast appears; video document created in Firestore with status "Pending"; video appears in gallery | Upload successful; document created | Pass |
| 2 | Upload file exceeding 100MB limit | File: 150MB `.mp4` | Error: "File exceeds maximum upload size" displayed; upload blocked at client level | Error displayed; upload prevented | Pass |
| 3 | Upload non-video file (`.pdf`) | File: document.pdf | Error: "Invalid file type. Only MP4 and WebM accepted" displayed | Error displayed | Pass |
| 4 | Upload with empty title field | File provided; title field empty | Error: "Title is required" displayed; upload blocked | Error displayed | Pass |

### Functional Testing 4: Admin Dashboard Display and Real-Time Updates

**Objective:** To ensure the Admin Dashboard correctly displays aggregated metrics and video history, and that real-time Firestore updates are reflected without page refresh.

**Table 5.8: Functional Testing 4 â€” Admin Dashboard**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Load Admin Dashboard with existing data | Firestore contains 5 videos (2 Flagged, 3 Approved) | KPI cards show: Total: 5, Flagged: 2, Approved: 3; Video table renders 5 rows with correct status badges | Metrics and table displayed correctly | Pass |
| 2 | New video uploaded by another user while Dashboard is open | Second user uploads video during admin session | New video row appears in table automatically without page refresh (via onSnapshot) | Real-time update received | Pass |
| 3 | Standard User attempts to navigate to `/admin` route | User with role = "user" enters `/admin` URL | React Router intercepts; user redirected to Home page | Redirected successfully | Pass |

### Functional Testing 5: Admin Override â€” Approve and Delete Actions

**Objective:** To ensure that admin approve and delete actions correctly update the Firestore database and remove items from the flagged queue.

**Table 5.9: Functional Testing 5 â€” Admin Override**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Admin clicks "Approve" on Flagged video | Video with status = "Flagged" | Video status changes to "Approved" in Firestore; badge color changes to Green; video available in gallery | Status updated; badge changed | Pass |
| 2 | Admin clicks "Delete" on Flagged video | Video with status = "Flagged" | Video document deleted from Firestore; video file deleted from Cloud Storage; video disappears from dashboard | Video fully removed | Pass |
| 3 | Admin clicks "Approve" on Pending video | Video with status = "Pending" | Video status changes to "Approved" in Firestore | Status updated | Pass |

---

## 5.3 Business Rules Testing

Decision table based testing technique is used to test business rules. The business rules were defined in the Functional Requirements and Use Cases. Decision based testing uses a systematic approach where inputs and outputs are provided in tabular form. It is a precise and compact way to model complicated logic. The table contains conditions and actions used for test cases where conditions are inputs and actions are outputs.

### Business Rules Testing 1: User Registration Rules (FR1.1, FR1.2)

**Table 5.10: Decision Table â€” User Registration Rules**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| Email follows valid format? | Y | N | Y | Y |
| Email is not already registered? | Y | Y | N | Y |
| Password is at least 6 characters? | Y | Y | Y | N |
| **Action: Create account and redirect to dashboard** | **Y** | N | N | N |
| **Action: Show "Invalid email format" error** | N | **Y** | N | N |
| **Action: Show "Email already in use" error** | N | N | **Y** | N |
| **Action: Show "Password must be at least 6 characters" error** | N | N | N | **Y** |

**Table 5.11: Test Cases Derived from Decision Table 5.10**

| No. | Email | Password | Expected Action | Actual Result | Status |
|---|---|---|---|---|---|
| 1 (Rule 1) | ali@gmail.com | Secure@1234 | Account created; redirected | Account created | Pass |
| 2 (Rule 2) | ali.gmail.com | Secure@1234 | "Invalid email format" error | Error displayed | Pass |
| 3 (Rule 3) | existing@gmail.com | Secure@1234 | "Email already in use" error | Error displayed | Pass |
| 4 (Rule 4) | ali@gmail.com | abc | "Password too short" error | Error displayed | Pass |

### Business Rules Testing 2: Role-Based Access Control & Video Status Rules

This decision table tests the RBAC rules governing which actions are permitted based on user authentication state, role, and video status â€” the core access control logic of PurePlay.

**Table 5.12: Decision Table â€” RBAC and Video Status Access Rules**

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
|---|---|---|---|---|
| User is authenticated? | Y | Y | N | Y |
| User has "admin" role in Firestore? | Y | N | N | Y |
| Video Status | Flagged | Flagged | Flagged | Approved |
| **Action: Access Admin Dashboard** | **Allow** | Deny & Redirect | Deny & Redirect | **Allow** |
| **Action: View Video in Modal** | **Allow** | Deny (UI Hidden) | Deny | **Allow** |
| **Action: Click "Approve" Button** | **Allow DB Write** | Deny | Deny | N/A |
| **Action: Click "Delete" Button** | **Allow** | Deny | Deny | **Allow** |

**Table 5.13: Test Cases Derived from Decision Table 5.12**

| No. | User Role | Auth Status | Video Status | Expected Action | Actual Result | Status |
|---|---|---|---|---|---|---|
| 1 (Rule 1) | Admin | Authenticated | Flagged | Approve/Delete allowed; Dashboard accessible | All actions available | Pass |
| 2 (Rule 2) | Standard User | Authenticated | Flagged | Dashboard denied; redirected to Home | Redirected | Pass |
| 3 (Rule 3) | None | Not authenticated | Flagged | All access denied; redirected to Login | Redirected to Login | Pass |
| 4 (Rule 4) | Admin | Authenticated | Approved | View allowed; Delete allowed; Approve N/A | Correct behavior | Pass |

---

## 5.4 Integration Testing

Integration testing verifies that different modules of the system work together correctly. Unlike unit testing (which checks isolated functions) and functional testing (which checks features from a user's perspective), integration testing focuses on the **interfaces, linkages, and data flow between modules** developed by different team members.

Since FYPs are team-based, integration testing is essential to ensure that the combined work of individual members forms a functioning system. Students must design at least one or two integration scenarios to demonstrate how modules interact and exchange data.

### Integration Testing 1: Video Upload â†’ Firebase Storage â†’ Firestore Document Creation (Module 'Video Intake' â†” Module 'Data Persistence')

**Testing Objective:** To ensure the video upload is processed correctly and the interface between the React Video Intake module, Firebase Cloud Storage, and Cloud Firestore is running correctly.

**Table 5.14: Integration Testing 1 â€” Upload â†’ Storage â†’ Firestore**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Upload video in React UI â†’ file stored in Firebase Storage â†’ metadata document created in Firestore | Valid `.mp4` file, 50MB, title: "Test Video" | File reliably exists in Storage bucket under `videos/{uid}/` path; Metadata document instantly created in Firestore `videos` collection with correct `download_url`, `status: "Pending"`, and `user_id` matching authenticated user | File in Storage; document in Firestore; linked correctly via download URL | Pass |
| 2 | Verify download URL is valid and streams video | `download_url` from Firestore document | URL loads video in browser HTML5 player without authentication errors; video plays correctly | Video streamed successfully | Pass |
| 3 | Delete video via Admin Dashboard â†’ Storage file and Firestore document both removed | `video_id` of existing video | Firestore document removed; Storage object deleted; no orphaned files remain | Both deleted correctly | Pass |

### Integration Testing 2: Firestore Status Update â†’ Admin Dashboard Real-Time UI Listener (Module 'Admin Dashboard' â†” Module 'Data Persistence')

**Testing Objective:** To ensure the Admin Dashboard correctly receives and displays real-time updates from Firestore, verifying that the interface between the React Dashboard module and Firestore's WebSocket synchronization is running correctly.

**Table 5.15: Integration Testing 2 â€” Firestore â†’ Dashboard Real-Time Sync**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| 1 | Change video status manually in Firebase Console â†’ Admin Dashboard UI updates automatically | Change `status` field from "Pending" to "Flagged" in Firebase Console | Admin Dashboard re-renders the video row with a Red "Flagged" badge without any browser refresh; KPI card "Flagged" count increments by 1 | UI updated via WebSocket; badge changed; count updated | Pass |
| 2 | New video document created by another user â†’ Dashboard reflects new entry | Second user uploads video while admin has Dashboard open | New row appears in the video table within 2 seconds; Total Uploads KPI increments; no page refresh required | Real-time update received within 1.5 seconds | Pass |
| 3 | Authentication token expiry â†’ Firebase automatically refreshes | JWT expires during active Dashboard session | Firebase SDK automatically refreshes token; user session continues seamlessly without arbitrary logouts; snapshot listeners remain active | Session maintained; no interruption | Pass |
