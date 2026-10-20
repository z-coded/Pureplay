# Prompt for PurePlay SDS (30% Implementation — Chapters 3, 4, 5)

---

**Role:**
You are an Expert Software Architect, Technical Writer, and Academic Evaluator. Your task is to generate a comprehensive, highly detailed Software Design Specification (SDS) for a project based on the provided reference file(s).

**Project Context & Immutable Variables:**
Before analyzing the attached file, you must understand the core context of the project. Do not deviate from these details:
* **Project Title:** PurePlay: An AI-Powered Video Filtering System for Child-Safe Media Consumption.
* **Project Authors:** Syed Zubair (CIIT/SP23-BCS-094/ISB, Section: BSR) and Maaz Bin Rashid (CIIT/SP22-BAI-023/ISB).
* **Institution:** COMSATS University Islamabad (CUI).
* **Core Architecture:** Component-Based Layered Architecture with an Event-Driven Asynchronous Task Pattern.
* **Tech Stack:** React.js (Frontend), Python Flask/Django (Backend), Celery + Redis (Task Orchestration), MongoDB (Metadata), MinIO (Binary Object Storage).
* **AI/Processing Components:** FFmpeg (Media processing), NudeNet / OpenNSFW2 (Visual CNN), OpenAI Whisper (Speech-to-Text), Detoxify (NLP Toxicity).

**Critical Scoping Rule — 30% Implementation (FYP-1):**
This document is for FYP-1, which represents the first 30% of the project. You MUST follow the exact same pattern as the attached VentureFit reference file:
* **Chapter 3 (Design & Architecture):** Describe the **full system architecture vision** — all five layers, all components, all data entities — as the complete architectural blueprint. Do NOT label anything as "planned" or "FYP-2". Present the entire design as one unified system.
* **Chapter 4 (Implementation):** State clearly at the start: **"The implementation covers Modules 1–3 only:"** Module 1 (User Authentication & Onboarding), Module 2 (Secure Video Intake Pipeline), and Module 3 (Administrative Insight Dashboard / Guardian Dashboard). Only write pseudocode, algorithms, security, APIs, UI screenshots, and deployment for these three modules. Do NOT write implementation details for AI models (NudeNet, Whisper, Detoxify) or XAI Timeline.
* **Chapter 5 (Testing):** Only write test cases for what is implemented in Chapter 4 (Modules 1–3). Do NOT write test cases for AI pipeline, age-aware thresholds, or XAI features.

**Instructions:**
1. Read and thoroughly analyze the attached VentureFit reference file(s).
2. Extract the relevant document structure, formatting patterns, table styles, and level of detail.
3. Map PurePlay's system onto the exact same SDS structure used by VentureFit.
4. Write in a formal, academic, and highly technical tone suitable for a university-level final year project submission.
5. Where diagrams are required, output a clear placeholder with instructions for the authors, like this: `> **[INSERT FIGURE X.X: DIAGRAM NAME HERE]** *Instructions: Draw...*`
6. Include a hint/placeholder for screenshots where applicable: `> **[INSERT FIGURE X.X: SCREENSHOT — Screen Name]** *Instructions: Capture a screenshot of...*`

**Required Document Structure (Strictly Adhere to This — Mirror VentureFit Exactly):**

**Chapter 3: Design and Architecture**
* 3.1 System Architecture Overview (Include Purpose subsection)
  * Describe the full 5-layer architecture: Presentation Layer (React.js), API Gateway Layer (Flask/Django), Service/Orchestration Layer (Celery + Redis), AI Processing Layer (FFmpeg + NudeNet + Whisper + Detoxify), Data Persistence Layer (MongoDB + MinIO)
  * Include a Table: Architecture Components, Description, Technology Used, Security Mechanism
* 3.2 Technologies and Services
  * Include a Table: Technology/Service, Description, Purpose of Usage, Location/Module Used
* 3.3 Architecture Style / Pattern
  * Describe each of the Five Layers in detail
  * Include Justification for Layered Architecture
  * Include Component Interaction description
  * Include a Figure placeholder for Layered Architecture Diagram
* 3.4 Design Models (for Object-Oriented Development Approach)
  * 1. Activity Diagrams — At least 3: (a) Video Upload & AI Censorship Pipeline, (b) Guardian Review & Override Flow, (c) User Authentication Flow
  * 2. Class Diagram — Show all MongoDB document model classes (User, Video, ChildProfile, AnalysisResult, XAITimelineEvent, AuditLog) and all service classes (AuthService, VideoIntakeService, CensorshipPipelineService, FrameExtractionService, VisualClassificationService, SpeechToTextService, ToxicityAnalysisService, DashboardService, GuardianReviewService)
  * 3. Sequence Diagrams — At least 3: (a) User Registration & Login, (b) Video Upload & Storage, (c) Admin Dashboard & Review
  * 4. State Transition Diagram — Video Moderation Lifecycle showing all states: Uploading → Pending → Processing → Analyzing_Visual → Analyzing_Audio → Aggregating → Approved/Flagged → Published/Rejected
* 3.5 Data Design
  * Data Transformation and Organization description
  * ERD figure placeholder
  * Key Data Entities Table with columns: Entity, Description, Storage Type, Relationships, Key Fields
  * Data Storage Systems Table with columns: Storage System, Purpose, Data Stored, Access Pattern/Security

**Chapter 4: Implementation**
* **Begin with:** "This chapter discusses the implementation details of the project. The implementation covers Modules 1–3 only: User Authentication and Onboarding, Secure Video Intake Pipeline, and Administrative Insight Dashboard."
* 4.1 Project Methodology & Algorithms
  * 4.1.1 Step-by-Step Agile Approach (3 sprints only for implemented modules)
  * 4.1.2 Algorithm Table — Pseudocode for: Video Upload & Storage Algorithm, Admin Override Algorithm, Authentication Algorithm. Format each exactly like VentureFit's Table 4.1
* 4.2 Training Results & Model Evaluation
  * State that the system uses pretrained models and no custom training is performed
  * List the datasets/models that will be used (NudeNet, Whisper, Detoxify) and their evaluation approach
  * For FYP-1, document FFmpeg preprocessing metrics only (extraction success rate, processing time)
* 4.3 Security Techniques
  * Password hashing (bcrypt), JWT authentication, RBAC, CORS, input validation, file upload validation, sandboxed FFmpeg execution
* 4.4 External APIs/SDKs
  * Table with columns: Name and Version, Description of API, Purpose of Usage, API endpoint/function/class
  * Include: Flask/Django, PyMongo, MinIO SDK, Celery, Redis, FFmpeg, bcrypt, PyJWT, React.js, Vite, Tailwind CSS
* 4.5 User Interface
  * Describe 5 screens with screenshot placeholders: (1) Registration, (2) Login, (3) Guardian Dashboard, (4) Video Upload Portal, (5) Admin Review Modal
* 4.6 Deployment
  * Describe local development setup (not Docker — that's for FYP-2)
  * List all processes: React dev server, Flask/Django, Celery worker, Redis, MongoDB, MinIO

**Chapter 5: Testing and Evaluation**
* **Begin with:** "Once the system has been successfully developed, testing has to be conducted... There are few types of testing which include unit testing, functional testing, business rules testing and integration testing."
* 5.1 Unit Testing — 4 unit test tables covering:
  * (1) validateEmail() function
  * (2) hash_password() and verify_password()
  * (3) validateVideoFile() — MIME type and size
  * (4) JWT token issuance and invalidation
  * Each table: No., Test Case, Attribute and Value, Expected Result, Actual Result, Status
* 5.2 Functional Testing — 5 functional test tables covering:
  * (1) User Registration with valid/invalid inputs
  * (2) User Login with valid/invalid credentials
  * (3) Video Upload with valid/invalid files
  * (4) Dashboard metrics display and real-time updates
  * (5) Admin Override (Approve/Reject actions)
  * Each table: No., Test Case, Attribute and Value, Expected Result, Actual Result, Result (Pass/Fail)
* 5.3 Business Rules Testing — 2 Decision Tables:
  * (1) User Registration Rules — conditions: email valid?, email unique?, password length? → actions: create account or show specific error
  * (2) RBAC & Video Status Rules — conditions: authenticated?, admin role?, video status? → actions: allow/deny dashboard, modal, approve, delete
  * Include derived test case tables for each decision table
* 5.4 Integration Testing — 2 integration test scenarios:
  * (1) Video Upload → MinIO Storage → MongoDB Document Creation (Module 'Video Intake' ↔ Module 'Data Persistence')
  * (2) MongoDB Status Update → Dashboard UI Real-Time Refresh (Module 'Dashboard' ↔ Module 'Data Persistence')
  * Each table: No., Test Case/Test Script, Attribute and Value, Expected Result, Actual Result, Result

**Execution:**
Acknowledge these instructions, review the attached VentureFit reference file, and generate the complete SDS document for PurePlay (Chapters 3, 4, and 5) following the exact same formatting, tone, table styles, and level of detail as the reference.
