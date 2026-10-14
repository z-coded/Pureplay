# COMSATS University, Islamabad Pakistan

# PurePlay
A project presented to
COMSATS University, Islamabad
In partial fulfillment
of the requirement for the degree of
Bachelor of Science in Computer Science (2023-2027)

By
[Author Names]

Supervisor
[Supervisor Name]

The candidate confirms that the work submitted is their own and appropriate credit has been given where reference has been made to the work of others.

---

# Abstract
The rapid proliferation of user-generated content on digital platforms has made manual moderation increasingly unsustainable. A huge number of digital community failures are attributed to "content pollution," where platforms become overrun with inappropriate, explicit, or policy-violating media due to a lack of structured moderation at the intake stage. Currently, platform administrators rely on fragmented, reactive reporting mechanisms—waiting for community members to flag videos—where inappropriate media often reaches the public domain before it can be removed. This slow, unstructured process results in unsafe community environments, exposes platforms to legal liability, and places an immense psychological burden on human moderators. Existing solutions fail to provide a seamless, integrated environment that systematically intercepts, analyzes, and actions video uploads before they are published. 

PurePlay addresses this critical gap by consolidating the entire video intake and moderation workflow into a single, AI-powered workspace. By automatically intercepting video content through a censorship intelligence pipeline upon upload, extracting visual heuristics, classifying the media based on predefined safety policies, and alerting administrators to violations, the platform transforms a chaotic moderation process into a structured, proactive defense mechanism. The system further generates actionable logs in an Admin Dashboard, allowing moderators to review flagged content safely, approve safe media, and manage user accounts efficiently. By reducing manual review effort and preventing exposure to inappropriate content, PurePlay increases the safety and reliability of digital platforms. The core platform is built as a highly responsive React Single Page Application (SPA), utilizing Firebase Authentication, Cloud Firestore, and Cloud Storage to deliver a secure, highly scalable serverless infrastructure.

---

# Abbreviations
Abbreviation | Description
--- | ---
API | Application Programming Interface
BaaS | Backend-as-a-Service
FR | Functional Requirement
JWT | JSON Web Token
SPA | Single Page Application
UI/UX | User Interface / User Experience
ML | Machine Learning
CV | Computer Vision
NoSQL | Not Only SQL
SDLC | Software Development Life Cycle

---

# Table of Contents
[PLACEHOLDER: Automatically generated Table of Contents in Word]

---

# List of Figures
[PLACEHOLDER: Automatically generated List of Figures in Word]

---

# Chapter 1: Introduction and Problem Definition

This chapter situates PurePlay within the digital media ecosystem, articulates the precise problem it addresses, defines the proposed solution and its objectives, surveys related systems, and specifies the tools and technologies that will underpin the implementation.

## 1.1 Overview of the Project
PurePlay is an AI-powered, web-based video moderation platform built for administrators, community managers, and platform owners who require structured, automated filtering of user-generated media before it becomes publicly accessible. The platform accepts a user's video upload and systematically processes it through an AI censorship pipeline to detect explicit, violent, or otherwise inappropriate content. These raw signals are evaluated against strict platform policies, and the video is automatically assigned a status of Approved, Flagged, or Rejected. 

The platform is delivered as a React.js single-page application (SPA) backed by a serverless Firebase architecture. It comprises distinct modules that guide a user from raw video intake through to secure publication, and provides administrators with an interactive, data-rich dashboard replacing what would otherwise be hours of manual queue review and content sifting. By automating data collection, video processing, and status assignment, PurePlay reduces moderation latency from days to mere seconds.

## 1.2 Vision Statement
For digital communities and platform administrators who struggle to maintain safe environments amidst an overwhelming volume of user-generated content, PurePlay is an AI-assisted video moderation platform that transforms raw media intake into a secure, filtered content stream. Unlike traditional platforms relying solely on reactive user reports, our product automatically analyzes video uploads against strict censorship policies, significantly reducing inappropriate content exposure and streamlining the administrative review process, thereby dramatically increasing platform trust and user safety.

## 1.3 Problem Statement
With the exponential growth of user-generated video content, platform administrators struggle to moderate media effectively and consistently. Without automated, structured validation methods, platforms often rely on manual review, personal assumptions, or feedback from community reporting. This approach frequently results in the prolonged exposure of products and users to explicit or harmful media. Currently, ensuring platform safety requires administrators to manually watch, flag, and remove inappropriate videos, a process that is time-consuming and requires significant effort to identify policy violations across thousands of daily uploads. In many cases, moderators suffer from severe psychological strain due to repeated exposure to toxic content. 

Existing tools such as built-in forum flags or disconnected AI APIs provide limited assistance because they focus on isolated tasks rather than the entire moderation lifecycle. These tools also assume that administrators have the technical expertise to link AI outputs to their databases. Consequently, there is no integrated system that automatically gathers, analyzes, and actions video data to guide administrators in maintaining platform hygiene. The absence of such a system leads to inefficient review processes and increases the risk of platform liability. PurePlay is developed to address this exact problem by providing a unified platform that automates video intake, executes AI-driven censorship analysis, and generates strategic administrative insights to support data-driven moderation.

## 1.4 Problem Solution
PurePlay acts as an intelligent gatekeeper and co-pilot for platform moderation. The platform ingests user uploads via Firebase Cloud Storage and systematically triggers an AI censorship pipeline to assess safety compliance. It then presents all findings through an intuitive Admin Dashboard, guiding the moderator through flagged content review, user management, and platform analytics. By automating the initial detection phase, PurePlay reduces moderation time significantly, transforming a reactive reporting culture into a proactive, AI-defended ecosystem.

## 1.5 Objectives of the Proposed System
- **BO-1:** Reduce manual video review time significantly through automated AI censorship logic and visual heuristic extraction.
- **BO-2:** Provide a seamless, secure video uploading experience for end-users utilizing highly scalable Cloud Storage.
- **BO-3:** Implement a robust, JWT-backed authentication and profile management system separating Standard Users from Administrators.
- **BO-4:** Deliver a comprehensive Admin Dashboard for monitoring system-wide insights, historical video logs, and real-time user activity.
- **BO-5:** Enable secure, sandboxed real-time playback and manual review overrides for AI-flagged content via a modal interface.
- **BO-6:** Ensure highly scalable and resilient metadata management using a NoSQL cloud database (Firestore).
- **BO-7:** Equip administrators with key performance indicator (KPI) tracking regarding platform safety metrics and AI accuracy.

## 1.6 Scope
PurePlay is a web-based platform comprising a frontend interactive UI and a serverless backend. The frontend handles video uploads, user authentication, and admin dashboards, while the Firebase backend manages secure storage, database synchronization, and data persistence. The system utilizes structured document database storage and event-driven triggers for managing AI analysis. The platform is strictly scoped to recorded video content moderation and does not include live streaming functionalities.

### 1.6.1 Limitations and Constraints
- **LI-1:** AI moderation accuracy depends heavily on the underlying model's training parameters; false positives and false negatives will inherently occur, necessitating human-in-the-loop review.
- **LI-2:** Video upload sizes, bitrates, and processing speeds are constrained by client bandwidth and Firebase Cloud Storage quotas.
- **LI-3:** The system is heavily reliant on a continuous internet connection for real-time Firestore WebSocket synchronization.
- **LI-4:** Browser compatibility is restricted to modern iterations of Chrome, Firefox, Safari, and Edge.

## 1.7 Modules
PurePlay is composed of eight comprehensive functional modules, each scoped to a distinct stage of the moderation and user workflow.

**Module 1.7.1: User Authentication and Onboarding**
- FE-1: Secure user registration and login utilizing Firebase Authentication.
- FE-2: Strict role-based access control (RBAC) distinguishing Admin privileges from Standard Users.
- FE-3: Session persistence and JSON Web Token (JWT) management.
- FE-4: Password recovery and secure account management features.

**Module 1.7.2: Secure Video Intake Pipeline**
- FE-1: Drag-and-drop interface for secure video file uploads.
- FE-2: Rich metadata collection (title, description, tags, category) linked securely to the video asset.
- FE-3: Real-time chunked upload progress indicators.
- FE-4: Automatic generation of signed download URLs.

**Module 1.7.3: AI Content Moderation Engine**
- FE-1: Automated Cloud Function triggers that send uploaded video metadata to the censorship logic.
- FE-2: Heuristic classification of content based on policy violations (e.g., violence, nudity).
- FE-3: Algorithmic confidence scoring for detected anomalies.
- FE-4: Automatic status assignment (Pending, Flagged, Approved, Rejected).

**Module 1.7.4: Administrative Insight Dashboard**
- FE-1: A unified home screen featuring high-level system metrics (Total Uploads, Flag Ratio).
- FE-2: Interactive data visualizations representing platform health statistics over time.
- FE-3: Real-time synchronization of newly uploaded content.

**Module 1.7.5: Flagged Content Review System**
- FE-1: A dedicated flagged-content queue displaying high-priority AI-detected violations.
- FE-2: Modal-based, sandboxed video player for safe administrative review.
- FE-3: Manual override controls (Approve/Delete) updating Firestore in real-time.
- FE-4: Audit logging of which administrator performed the override action.

**Module 1.7.6: Public Content Gallery**
- FE-1: Authenticated gallery displaying safely approved videos.
- FE-2: Responsive, accessible UI optimized for mobile and desktop viewing.
- FE-3: Search and filtering capabilities based on video metadata.

**Module 1.7.7: User Management System**
- FE-1: Administrative interface to view registered users.
- FE-2: Ability to suspend or ban users who repeatedly violate platform policies.
- FE-3: Tracking of user-specific upload histories and flag counts.

**Module 1.7.8: System Configuration and Reporting**
- FE-1: Export functionality to generate moderation reports.
- FE-2: Configuration of AI sensitivity thresholds.

## 1.8 Related System Analysis and Literature Review
### 1.8.1 Literature Review
Prior research on content moderation consistently identifies two primary failure modes in early-stage platforms: administrators either skip moderation entirely due to volume, or rely on tools that are too disconnected to provide meaningful efficiency. Traditional methodologies rely heavily on reactive community reporting, an approach that inevitably allows harmful content a window of exposure, damaging brand reputation. Recent studies demonstrate that integrating automated Machine Learning models at the intake phase can intercept up to 95% of explicit material before publication. PurePlay's architecture is directly informed by these findings, utilizing an event-driven AI pipeline to filter content natively.

### 1.8.2 Related System Analysis
| Application Name | Weakness | Proposed Project Solution |
| --- | --- | --- |
| Manual Forum Moderation | Unstructured; time-consuming to watch hours of content; highly prone to human error, cognitive bias, and extreme psychological strain. | PurePlay automates the initial screening via AI, presenting human moderators only with high-risk, flagged content, significantly reducing exposure. |
| Reactive Report Systems (e.g., standard YouTube model) | Harmful content is public until enough users report it, causing unmitigated damage before removal is enacted. | PurePlay evaluates content strictly at the intake stage, preventing it from ever reaching the public feed if flagged by the AI. |
| Disconnected AI APIs (e.g., AWS Rekognition alone) | Requires heavy custom integration and lacks a built-in UI for human override, making it useless for non-technical administrators. | PurePlay offers an integrated, ready-to-use React dashboard combining the AI logic with the storage and presentation layers natively. |

## 1.9 Tools and Technologies
| Tools And Technologies | Version | Rationale & Purpose of Usage |
| --- | --- | --- |
| React.js / Vite | Latest | High-performance frontend user interface and dashboard rendering via virtual DOM. |
| Tailwind CSS | Latest | Enforces a modern, utility-first responsive UI and styling system. |
| Firebase Authentication | Latest | Secure identity management, password hashing, and JWT session handling. |
| Firebase Cloud Firestore | Latest | NoSQL document database providing real-time WebSocket synchronization for metadata and logs. |
| Firebase Cloud Storage | Latest | Highly scalable binary object storage optimized for large video files. |
| Node.js | v18+ | Execution environment for server-side logic and package management. |

## 1.10 Project Contribution
PurePlay makes several concrete technical and conceptual contributions that distinguish it from existing solutions:
- **Custom-Built Moderation Pipeline:** Combines secure user intake, automated heuristic analysis, and human review into a single, unbreakable pipeline.
- **Serverless Event-Driven Architecture:** Utilizes Firebase BaaS to completely remove infrastructure overhead, ensuring high availability, zero-maintenance scaling, and instant database triggers.
- **Human-in-the-Loop AI Paradigm:** Balances the rapid efficiency of automated machine learning with the nuanced, context-aware oversight of human administrators, effectively solving the "false positive" dilemma.

## 1.11 Relevance to Course Modules
- **Web Technologies:** Developed a high-performance interactive dashboard using React and Vite, implementing complex state management and hook-based API interactions.
- **Database Systems:** Implementation of NoSQL document modeling, denormalization strategies, and real-time synchronization via Firestore.
- **Artificial Intelligence:** Integration of automated classification algorithms and heuristic scoring systems.
- **Software Engineering:** Application of SDLC phases, modular layered architecture, rigorous requirement gathering, and testing methodologies.

---

# Chapter 2: Requirement Analysis

This chapter documents the exhaustive system requirements for PurePlay. It identifies the user classes, describes the operating environment, presents functional requirements derived from mockup analysis, and details back-end AI processing via event-response tables.

## 2.1 User Classes and Characteristics
| User Classes | Description |
| --- | --- |
| Standard User (Primary User) | The primary content creator and consumer. A standard user uploads videos, manages their profile, and views approved content within the platform gallery. They require an intuitive, fast upload experience and are shielded from the moderation complexities. |
| Administrator (Secondary User) | A highly privileged system manager responsible for platform safety. Administrators review flagged content in the Admin Dashboard, manage user accounts, interpret system metrics, and possess the authority to permanently approve or delete content. |

## 2.2 Operating Environment
- **OE-1:** The system shall operate as a web-based application accessible through modern desktop browsers (Chrome, Firefox, Edge, Safari) over a secure HTTPS connection.
- **OE-2:** The backend system and database shall be hosted entirely on Firebase's globally distributed cloud infrastructure.
- **OE-3:** The system should support users accessing the application from geographically distributed locations, prioritizing low-latency video streaming.
- **OE-4:** The system shall rely on a stable internet connection; in the event of temporary unavailability, the frontend shall gracefully alert the user.

## 2.3 Design and Implementation Constraints
- **CON-1:** The frontend shall be implemented exclusively using React.js and Vite. Tailwind CSS shall be used for all styling. No alternative frameworks (like Angular or Vue) shall be used.
- **CON-2:** All structured data shall be stored in Firebase Cloud Firestore.
- **CON-3:** Video files shall be stored exclusively in Firebase Cloud Storage.
- **CON-4:** User authentication shall be implemented exclusively using Firebase Authentication. Custom rolling of cryptographic authentication is strictly prohibited.

## 2.4 Use Case Diagram

[PLACEHOLDER: Figure 1: Admin Use Case Diagram]

[PLACEHOLDER: Figure 2: Standard User Use Case Diagram]

## 2.5 Requirement Identifying Technique
This section describes the techniques used to identify and document the functional requirements. Mockup-Based Requirement Analysis is used for all front-end facing features. Interactive elements such as buttons, forms, and video players are analyzed to derive functional requirements. For backend processes, Event-Response Tables are used to model the system’s response to specific triggering events (e.g., successful video upload triggering AI analysis).

## 2.6 Functional Requirements

### 2.6.1 Module 1: User Authentication and Onboarding

[PLACEHOLDER: Figure 3: Module 1 — User Onboarding Mockup]

| Feature | Functional Requirement (FR-ID: Statement) | Business Rule |
| --- | --- | --- |
| User Registration | FR1.1: The system shall display a registration form capturing the user's email and password. | Handled natively by Firebase Auth. Rejects duplicate emails. |
| Password Complexity | FR1.2: The system shall enforce minimum password length and complexity. | Passwords must be 6+ characters. |
| User Login | FR1.3: The system shall authenticate a user by validating credentials and returning a secure session token. | Plaintext passwords shall never be transmitted or stored. |
| Role Assignment | FR1.4: The system shall distinguish between Standard Users and Administrators upon successful login. | Roles are managed via restricted Firestore user documents. |
| Session Termination | FR1.5: The system shall invalidate the session token upon user sign-out. | All local React states must be wiped upon sign-out. |

### 2.6.2 Module 2: Video Upload and Intake

[PLACEHOLDER: Figure 4: Module 2 — Video Upload Mockup]

| Feature | Functional Requirement (FR-ID: Statement) | Business Rule |
| --- | --- | --- |
| File Selection | FR2.1: The system shall provide a drag-and-drop zone or file picker specifically for `.mp4` and `.webm` files. | Files must not exceed the globally configured size limit (e.g., 100MB). |
| Metadata Input | FR2.2: The system shall capture Title and Description for the corresponding video. | Both fields are strictly mandatory before the upload process can begin. |
| Storage Transfer | FR2.3: The system shall securely upload the binary file to Firebase Storage. | N/A |
| Database Binding | FR2.4: The system shall write a metadata record to Firestore containing the Storage URL and uploader ID. | Video status defaults firmly to "Pending" upon successful write. |
| Progress Indicator | FR2.5: The UI shall display a real-time byte-transfer progress bar. | Must update dynamically via Firebase upload task observers. |

### 2.6.3 Module 3: Admin Dashboard

[PLACEHOLDER: Figure 5: Module 3 — Admin Dashboard Mockup]

| Feature | Functional Requirement (FR-ID: Statement) | Business Rule |
| --- | --- | --- |
| Metrics Display | FR3.1: The dashboard shall display aggregated metrics: total uploads, flagged count, and approved count. | Data must reflect real-time Firestore aggregations using snapshot listeners. |
| Flagged Queue | FR3.2: The system shall render a tabular list of videos currently marked "Flagged". | Ordered by upload date or AI severity score. |
| Video Review | FR3.3: The system shall provide a modal-based video player for admins to watch flagged content. | Must load securely; video controls must be fully accessible. |
| Action Buttons | FR3.4: Admins shall be able to click "Approve" or "Delete" on any queued video. | Status updates must reflect immediately in Firestore, removing the item from the queue. |

### 2.6.4 Backend Pipeline: AI Event-Response Logic

| Event Name | Trigger Source | System State (Before) | Response | System State (After) | Exception Handling |
| --- | --- | --- | --- | --- | --- |
| Video Uploaded | Firebase Storage completion | Status = Pending | Trigger AI model to analyze video frames and generate severity score. | Analysis in progress | If AI service is down, leave status as Pending and log error. |
| AI Analysis Complete | AI Engine | Analysis in progress | Update Firestore video document status to "Approved" or "Flagged" based on score. | Status = Flagged/Approved | If write fails, enqueue retry. |
| Admin Override | React Admin UI | Status = Flagged | Admin clicks "Approve"; update Firestore document. | Status = Approved | If unauthorized, reject with 403 Forbidden. |

## 2.7 Non-Functional Requirements
- **Reliability:** Firebase services guarantee 99.9% uptime. The React frontend should fail gracefully and display offline indicators if the network drops.
- **Usability:** Dashboards must feature clear typography (e.g., Inter or Roboto), intuitive sidebar navigation, and strict status color-coding (Green=Approved, Red=Flagged, Yellow=Pending).
- **Performance:** Upload metadata must reflect in the admin dashboard in under 2 seconds. Video playback must utilize streaming protocols to minimize buffering.
- **Security:** All database rules must strictly validate the user's Auth UID before permitting read/write operations.

---

# Chapter 3: Design and Architecture

## 3.1 System Architecture Overview
The system follows a highly scalable Serverless Client-Server architecture. The frontend (React SPA) communicates directly with Firebase via official SDKs. This architecture completely removes the need for a traditional middle-tier REST API for standard CRUD operations, relying instead on highly secure Firestore Security Rules to enforce authorization and business logic at the database edge.

[PLACEHOLDER: Figure 6: System Architecture Diagram]

## 3.2 Technologies and Services
| Technology / Service | Description | Purpose of Usage |
| --- | --- | --- |
| React.js | Frontend library | Builds the dynamic, non-refreshing Single Page Application UI. |
| Firebase Auth | Identity Provider | Manages user credentials, login states, password recovery, and secure session tokens. |
| Cloud Firestore | NoSQL Database | Stores user metadata, relational video logs, and real-time moderation status. |
| Cloud Storage | Object Storage | Securely hosts the massive raw binary video `.mp4` files. |

## 3.3 Architecture Style / Pattern
PurePlay utilizes a **Backend-as-a-Service (BaaS) Pattern**.
1. **Presentation Layer:** React components handling state, DOM rendering, and user interactions.
2. **Service/Context Layer:** Custom React Hooks (e.g., `useAuth`, `useFirestore`) abstracting external API calls and managing complex asynchronous states.
3. **Data/Persistence Layer:** Firebase handles global data distribution, persistent offline caching, and real-time WebSockets.

[PLACEHOLDER: Figure 7: Layered Architecture Diagram]

## 3.4 Design Models

### 3.4.1 Design Models for Object-Oriented Development Approach

[PLACEHOLDER: Figure 8: Activity Diagram - Video Upload and Processing Pipeline]

[PLACEHOLDER: Figure 9: Class Diagram - Full System Models and Services]

[PLACEHOLDER: Figure 10: Sequence Diagram - Video Upload Flow]

[PLACEHOLDER: Figure 11: Sequence Diagram - Admin Moderation Flow]

[PLACEHOLDER: Figure 12: State Machine Diagram - Video Moderation Lifecycle]

## 3.5 Data Design
The system employs a highly denormalized NoSQL structure optimized for rapid read operations.

[PLACEHOLDER: Figure 13: Entity Relationship Diagram (ERD)]

### Database Entities
| Entity | Storage Type | Relationships | Key Fields |
| --- | --- | --- | --- |
| Users | Firebase Auth / Firestore | One-to-many with Videos | `uid`, `email`, `role`, `created_at`, `display_name` |
| Videos | Cloud Firestore | Many-to-one with Users | `video_id`, `user_id`, `title`, `description`, `storage_url`, `status`, `ai_score`, `timestamp` |

---

# Chapter 4: Implementation

## 4.1 Project Methodology & Algorithms
The project was executed using an iterative Agile methodology. 
**Core Upload Algorithm Pseudocode:**
1. User authenticates via Firebase Auth. System mints JWT.
2. User selects video file. React validates MIME type (`video/mp4`).
3. React invokes `uploadBytesResumable(storageRef, file)`.
4. Progress observer updates React state variable `% complete`.
5. Upon 100%, `getDownloadURL()` is invoked.
6. React executes `setDoc()` to Firestore `videos` collection with metadata, URL, and `status: 'Pending'`.
7. Firestore Trigger fires, passing URL to AI model.
8. AI Model computes confidence matrix. If `explicit_score > 0.85`, status updated to 'Flagged'.

## 4.3 Security Techniques
- **Authentication:** JWT tokens managed securely by the Firebase SDK, preventing unauthorized forgery.
- **Database Rules:** Firestore Rules ensure `allow write: if request.auth != null;` and strictly restrict Admin actions (like deleting other users' videos) based on the `role == 'admin'` attribute.
- **Storage Rules:** File size limits (max 100MB) and strict MIME type restrictions (`video/*`) are enforced natively by Firebase Storage security rules, preventing malicious payload uploads.

## 4.5 User Interface
The UI was constructed using Tailwind CSS to guarantee responsive, accessible, and visually stunning layouts.

[PLACEHOLDER: Figure 14: Login Screen UI]
[PLACEHOLDER: Figure 15: Registration Screen UI]
[PLACEHOLDER: Figure 16: Main User Upload Screen UI]
[PLACEHOLDER: Figure 17: Admin Dashboard Flagged Content Screen UI]
[PLACEHOLDER: Figure 18: Modal Video Review UI]

---

# Chapter 5: Testing and Evaluation

Once the system components were developed, rigorous testing was conducted to verify functional integrity and business logic compliance.

## 5.1 Unit Testing
Unit tests verify the smallest testable components in absolute isolation.
| No. | Test Case | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- |
| 1 | Render `VideoCard` component with "Approved" status props. | Component displays Green badge and Play button. | Displayed Green badge | Pass |
| 2 | Render `VideoCard` component with "Flagged" status props. | Component displays Red badge and Warning icon. | Displayed Red badge | Pass |
| 3 | Call `formatDate()` utility on raw UNIX timestamp. | Returns human-readable formatted string (e.g., "Oct 12, 2023"). | Correct format | Pass |
| 4 | Call `validateEmail()` utility on "invalid-email.com". | Returns boolean `False`. | Returned False | Pass |

## 5.2 Functional Testing
Functional testing evaluates entire user-facing workflows through the React UI.
| No. | Test Case | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- |
| 1 | Register new account with valid credentials. | Account created in Auth; user successfully redirected to Upload dashboard. | Redirected | Pass |
| 2 | Login attempt with incorrect password. | Immediate UI error message "Invalid credentials" displayed; access denied. | Error displayed | Pass |
| 3 | Upload `.mp4` file strictly under size limit. | Progress bar smoothly reaches 100%; success toast appears; UI re-renders gallery. | Upload successful | Pass |
| 4 | Admin clicks "Approve" on flagged video modal. | Video vanishes from Flagged queue; status updates to "Approved" in DB. | Queue updated | Pass |
| 5 | Standard User attempts to navigate to `/admin` route. | React Router intercepts and redirects user back to Home page. | Redirected | Pass |

## 5.3 Business Rules Testing
Decision table based testing technique used to rigorously test business rules and RBAC.

| Condition | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
| --- | --- | --- | --- | --- |
| User is authenticated? | Y | Y | N | Y |
| User has "Admin" role in Firestore? | Y | N | N | Y |
| Video Status | Flagged | Flagged | Flagged | Approved |
| **Action: Access Admin Dashboard** | Allow | Deny & Redirect | Deny & Redirect | Allow |
| **Action: View Video in Modal** | Allow | Deny (UI Hidden) | Deny | Allow |
| **Action: Click "Approve" Button** | Allow DB Write | Deny | Deny | N/A |

## 5.4 Integration Testing
Integration testing ensures different modules and third-party Firebase services communicate correctly.
| No. | Test Case | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- |
| 1 | UI Upload -> Firebase Storage -> Firestore Document creation sequence. | File reliably exists in Storage bucket; Metadata document is instantly created in Firestore linked via correct Download URL. | Linked correctly | Pass |
| 2 | Firestore Status Update -> Admin Dashboard React UI listener. | Changing video status manually in Firebase Console instantly triggers a UI re-render in the React Admin Dashboard without browser refresh. | UI updated via webSockets | Pass |
| 3 | Authentication Token Expiry. | When JWT expires, Firebase automatically refreshes token, maintaining seamless user session without arbitrary logouts. | Session maintained | Pass |
