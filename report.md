# PhishBERT
## Intelligent Phishing Email Detection with Context-Aware NLP and Operational Analytics

Final Year Project Report (Comprehensive Draft)

Student Name: [Add Your Name]  
Student ID: [Add Your ID]  
Module: COMP1682 Final Year Project  
Programme: BSc Computing  
Supervisor: [Add Supervisor Name]  
Submission Date: [Add Date]

Word Count (Main Body Excluding Abstract, Contents, Lists, References, and Appendices): 19,569 (draft count; recalculate in final Word export)

---

## Declaration

I declare that this report is my own work and that all external sources used in the preparation of this document have been appropriately acknowledged and referenced.

---

## Declaration of AI Use

I used AI while undertaking this assignment in the following ways:

- To develop research questions on the topic: YES
- To create an outline of the topic: YES
- To explain concepts: YES
- To support my use of language: YES
- To summarise the following articles/resources: YES
	1. Devlin, J. et al. (2019) BERT: Pre-training of deep bidirectional transformers for language understanding.
	2. Arrieta, A.B. et al. (2020) Explainable Artificial Intelligence (XAI): Concepts, taxonomies, opportunities and challenges.
	3. OWASP Foundation secure development guidance.
	4. Supabase documentation for authentication, PostgreSQL, and API operations.
	5. Netlify Functions documentation for serverless deployment and routing.
	6. Hugging Face Inference API documentation for model serving behavior.
- In other ways, as described below: YES

Additional AI use notes:

- AI assistance was used to improve report structure, technical proofreading, chapter consistency, and completeness checks against the formal template.
- All technical claims and implementation descriptions were verified against the project codebase and artifacts before inclusion.

---

## Table of Contents

Insert automatic Word Table of Contents here after applying Heading styles.

---

## List of Figures

Insert automatic Word List of Figures here after all figures and captions are inserted.

---

## List of Tables

Insert automatic Word List of Tables here after final formatting.

---

## Abbreviations

- API: Application Programming Interface
- NLP: Natural Language Processing
- HF: Hugging Face
- UI: User Interface
- UX: User Experience
- DB: Database
- SQL: Structured Query Language
- SSE: Server-Sent Events
- JWT: JSON Web Token
- CI/CD: Continuous Integration / Continuous Delivery
- XAI: Explainable Artificial Intelligence

---

## Abstract

Phishing continues to be one of the most practical and financially damaging cybersecurity attacks because it targets people rather than infrastructure. Unlike purely technical attacks, phishing campaigns rely on persuasive language, urgency framing, and trust impersonation. This makes static keyword rules and blacklist-only filters increasingly weak against modern adversaries. PhishBERT addresses this challenge by delivering a full-stack phishing email detection platform that combines contextual machine learning inference, operational API workflows, role-based user management, and analytical dashboards for decision support.

The current implementation is designed around two production roles: ADMIN and USER. Standard users can sign in, submit email content for analysis, and review their own scan history. Administrators can monitor threat logs, manage user accounts, and review aggregate analytics such as threat rates and high-risk sender patterns. A central serverless API implementation processes all requests and stores structured scan records in Supabase for persistence and longitudinal reporting.

From an architectural perspective, the project combines React + Vite frontend rendering, a Netlify function backend, and Supabase cloud data persistence. A local Express development server acts as a proxy to the same Netlify function handler to keep local and hosted behavior aligned, reducing environment drift and integration mismatch. This is a practical design choice because many student projects fail not due to model quality but because of inconsistent environment behavior between development and deployment.

The model inference path is intentionally strict in the current version. If the Hugging Face model endpoint is unavailable, the system does not generate synthetic phishing output. Instead, it returns a clear operational message: "model is sleeping at HF." This design prioritizes correctness and transparency over artificial continuity, which is important for trustworthy security tooling and honest evaluation.

The project also includes complete schema design in Supabase SQL, a model training notebook with cross-corpus evaluation strategy, and extensive supporting documentation for setup, deployment, and reporting. The resulting artifact is not only a classifier demo; it is a coherent software system with auditable behavior, explainable output surfaces, and structured extensibility for future enhancements such as event-driven ingestion and multi-provider mailbox support.

Keywords: phishing detection, transformer NLP, full-stack security application, Supabase, Netlify functions, explainable risk output, role-based cybersecurity dashboard.

---

## Acknowledgements

I would like to express sincere gratitude to my supervisor for structured guidance, review feedback, and practical recommendations throughout the project lifecycle. I also thank module staff and peers for technical discussion, testing support, and presentation feedback. Finally, I acknowledge my family for encouragement and patience during the iterative development, debugging, deployment hardening, and report-writing phases of this Final Year Project.

---

## 1. Introduction

### 1.1 Background

Email remains one of the most critical communication channels across education, business, healthcare, and government. Its ubiquity and low friction make it ideal for legitimate communication, but equally attractive for abuse. Phishing attacks exploit this by mimicking trusted entities and prompting recipients to disclose credentials, transfer funds, install malware, or open malicious links. Although enterprise email gateways have improved, many environments still rely heavily on static checks such as sender filters, known-domain blacklists, and pattern-matching rules.

These controls are still useful for known attacks, but modern phishing language often resembles normal organizational communication. Attackers deliberately reduce obvious lexical indicators and adopt context-rich writing that appears authentic. For this reason, contextual NLP approaches offer stronger detection potential than shallow heuristics. A contextual model can reason over sequence-level semantics, intent framing, and linguistic structure in a way that keyword-only systems cannot.

However, model capability alone is not enough for practical value. A realistic phishing defense workflow requires end-to-end functionality: input collection, API processing, storage, role separation, dashboard visibility, and robust failure handling. Many student projects stop at notebook-level metrics and do not address system operation in deployment settings. This project intentionally focuses on that implementation gap.

### 1.2 Problem Statement

The central problem addressed in this project is:

How can a student-feasible phishing detection system be designed and implemented so that it is accurate enough for practical experimentation, transparent enough for user trust, and robust enough to function consistently across local and hosted environments?

This problem decomposes into five sub-problems:

1. Classification quality: Can the model assign phishing risk in a way that is useful for human interpretation?
2. Workflow integration: Can users and admins interact with the detector through role-specific interfaces?
3. Persistence and analytics: Can results be stored in a way that supports trend analysis and auditability?
4. Security and correctness: Are authentication, authorization, and data handling aligned with safe engineering practice?
5. Deployment reliability: Does the system behave consistently when moved from development to production-style hosting?

### 1.3 Aim

To build and evaluate a complete phishing email detection platform that combines contextual NLP inference with secure full-stack workflows, persistent analytics, and deployment-aligned operational behavior.

### 1.4 Objectives

1. Review phishing detection methods and identify practical implementation gaps.
2. Build a robust backend API for analysis, user workflows, and admin operations.
3. Implement role-based frontend journeys for ADMIN and USER personas.
4. Design and deploy a Supabase schema for scans, users, settings, and audit logs.
5. Integrate model inference through a hosted Hugging Face endpoint.
6. Ensure local and hosted parity through unified API handling architecture.
7. Produce comprehensive technical documentation and report artifacts using formal template structure.

### 1.5 Scope

In scope:

- Manual phishing analysis for user-submitted email content.
- Role-based authentication and local session persistence.
- Admin user management and threat-log visibility.
- Aggregate analytics from stored scan data.
- Netlify-compatible function routing and development proxy strategy.
- Report-ready documentation and implementation traceability.

Out of scope:

- Multi-provider mailbox ingestion in current runtime code.
- Enterprise SIEM integration and SOC automation.
- Automated action enforcement (quarantine, auto-block, mailbox mutation).
- Full production hardening for high-scale traffic or compliance audits.

### 1.6 Contributions

This project contributes a practical reference architecture for student-level cybersecurity software engineering by:

- Unifying local and hosted API behavior through a shared function handler.
- Demonstrating role-segregated security dashboard and user analysis workflows.
- Maintaining explicit failure semantics for model unavailability instead of fabricated fallback outputs.
- Combining implementation artifacts (frontend, backend, SQL schema, model notebook) in one reproducible workspace.

### 1.7 Report Structure

The report follows a formal chapter pattern: literature and context, requirements and design, implementation and testing, critical appraisal, and future work. A dedicated implementation chapter includes a full file-by-file purpose mapping to provide traceability between source artifacts and architectural decisions.

---

## 2. Literature Review

### 2.1 Historical Evolution of Phishing Detection

Phishing detection methods evolved from static blacklist systems to feature-engineered machine learning, and then to contextual NLP architectures. Blacklists remain useful for known malicious infrastructure but fail rapidly when attackers rotate domains or use compromised legitimate hosts. Rule engines can detect common patterns (for example, urgent wording plus suspicious links), yet these patterns are both noisy and adversary-adaptable.

Traditional machine learning approaches improved performance by modeling lexical and structural features: TF-IDF vectors, n-gram frequencies, sender-domain features, and URL token statistics. These methods are computationally efficient and often effective on constrained datasets, but they struggle when semantic context carries most of the malicious intent and obvious lexical cues are absent.

### 2.2 Contextual NLP and Transformer Models

Transformer-based models such as BERT and its variants represent language context bidirectionally. In phishing detection, this matters because the threat often lies in intent framing rather than isolated words. For example, the sentence "Please confirm your account details before access is restricted" may appear superficially legitimate yet carry strong social-engineering intent. Contextual embeddings capture this better than sparse lexical features.

The model notebook in this project uses a ModernBERT-base configuration and combines multiple dataset sources to improve diversity. The training pipeline includes class balancing through weighted sampling and evaluates both standard splits and cross-corpus generalization. This is important because overfitting to one dataset style can produce optimistic results that do not transfer.

### 2.3 Explainability in Security Decision Systems

Security tools must not only predict but also communicate confidence and uncertainty. In operational settings, users and analysts need interpretable outputs to make proportionate responses. A phishing classifier that returns only a binary label can encourage over-trust and reduce human oversight.

PhishBERT surfaces probability-derived indicators (phishing probability, confidence, threshold comparisons) in the user and admin interfaces. While this is not full token-level explainability, it provides practical transparency that helps users evaluate severity rather than reacting blindly.

### 2.4 Reliability and Deployment as Research Gaps

A recurring weakness in student and prototype literature is deployment realism. Many projects report strong notebook metrics but do not address:

- Environment-variable discipline,
- Cross-origin constraints,
- API routing behavior in static hosts,
- Runtime errors in hosted model dependencies,
- Role-segregated access control.

This project treats deployment architecture as a first-class component of quality. Local development routes through the same Netlify function logic as production API calls, minimizing divergence and reducing hidden integration risk.

### 2.5 Ethical and Operational Implications in Literature

Current research also emphasizes false-positive cost. In phishing defense, false negatives create risk exposure, but false positives degrade trust and can disrupt legitimate workflows. Therefore, model output should support calibrated interpretation and avoid fabricated confidence when inference backends fail.

The current implementation aligns with this principle by removing heuristic fallback scoring in runtime paths. If the HF endpoint is unavailable, the system reports unavailability directly rather than simulating a result.

### 2.6 Positioning of This Work

This project is positioned as an integration-first applied NLP system rather than a model-only benchmark exercise. Its value lies in combining:

- Contextual model inference,
- Secure API and persistence workflows,
- Role-aware UI/UX,
- Deployment-consistent behavior,
- Report-grade artifact traceability.

---

## 3. Review of Similar Products

### 3.1 Comparative Criteria

The comparative perspective in this project uses four dimensions:

1. Detection quality and confidence usability,
2. Integration readiness for practical workflows,
3. Operational visibility and historical traceability,
4. Deployment feasibility in constrained environments.

### 3.2 Pattern Observations from Existing Solutions

Commercial and research solutions often optimize one dimension at the expense of others:

- Gateway-first tools focus on traffic filtering but provide limited explainability for end users.
- Model demos focus on benchmark accuracy but omit robust app orchestration.
- Dashboard tools provide visibility but rely on external detection systems for core intelligence.

In contrast, educational and student-scale projects frequently build UI prototypes but skip robust data modeling and role control. This creates impressive demos with fragile internals.

### 3.3 Practical Gaps Addressed by PhishBERT

PhishBERT addresses these gaps by combining a real application stack with traceable model integration:

- API routes for auth, analysis, history, admin users, threats, and analytics.
- SQL schema with audit and settings tables.
- Centralized frontend API utility and deployment-aware messaging.
- Development proxy that mirrors production function behavior.

### 3.4 Current Product Position

The current codebase has transitioned from earlier integration-heavy design to a focused ADMIN/USER workflow with manual analysis and stored analytics. This yields a cleaner operational core suitable for report demonstration, while still preserving extension points for future mailbox provider integrations.

---

## 4. Legal, Social, Ethical and Professional Issues

### 4.1 Legal Considerations

Even in educational deployments, email content can contain personally identifiable information or sensitive business context. Legal compliance principles therefore still apply. The project's design avoids exposing privileged keys in client bundles and places all sensitive interactions in backend contexts. Environment variables are externalized and excluded from version control through ignore policies.

### 4.2 Data Minimization and Retention

The schema stores essential fields for analysis and trend review: sender, subject, snippet, confidence values, and timestamps. This supports operational analytics while avoiding unnecessary broad data collection. In future production deployment, retention windows and anonymization options should be configurable.

### 4.3 Ethical Risk of Misclassification

Any classifier can be wrong. In phishing detection, these errors have asymmetric costs. A false negative can expose users to harm; a false positive can reduce trust and waste analyst effort. The project mitigates this through confidence display and historical logs that allow post-hoc review.

### 4.4 Transparency During System Failure

One important ethical improvement in the current implementation is explicit failure signaling for model unavailability. Rather than producing synthetic classifications under outage conditions, the application returns "model is sleeping at HF." This avoids misleading users and protects evaluation integrity.

### 4.5 Professional Engineering Practice

Professional software practice is demonstrated through:

- Typed interfaces in frontend and backend,
- Role-gated API access for admin endpoints,
- Repeatable schema setup via SQL seed file,
- Deployment routing through explicit Netlify configuration,
- Consistent lint/type-check workflows.

### 4.6 Social Relevance

Phishing affects non-technical users disproportionately. A system that combines detection with understandable output and history can improve security awareness and encourage safer decision-making. Student projects in this domain can produce real value when engineered as usable systems rather than isolated model experiments.

---

## 5. Methodology

### 5.1 Development Approach

The project followed iterative development with architecture stabilization across multiple phases. Instead of one-pass implementation, each phase introduced capabilities and then corrected operational weaknesses discovered in practical use.

### 5.2 Iterative Phases

Phase 1: Baseline application skeleton  
- React frontend scaffold and route structure.
- Initial backend routes and database concept.

Phase 2: API and persistence foundation  
- Standardized auth, analysis, contact, and dashboard endpoints.
- SQL schema for users, scans, settings, and audit logs.

Phase 3: UX and role workflows  
- Distinct ADMIN and USER journeys.
- Protected routes and session persistence.

Phase 4: Deployment and consistency  
- Netlify function routing.
- Local server proxy to shared function handler.

Phase 5: Integrity hardening  
- Removal of heuristic fallback output in runtime analysis path.
- Explicit operational error reporting for model outage.

### 5.3 Artifact-Centered Validation

Each phase was validated against concrete artifacts:

- Build and lint pass state,
- Endpoint behavior,
- UI route access behavior,
- Data persistence correctness,
- Deployment-route correctness.

### 5.4 Rationale for Chosen Process

An incremental method was selected because cybersecurity software quality depends heavily on feedback loops. Integration bugs often appear only when components are connected under realistic conditions. Iteration allowed targeted correction without destabilizing unrelated functionality.

### 5.5 Reproducibility Strategy

Reproducibility is supported through:

- Environment templates in .env.example,
- SQL schema and seed script,
- Source-controlled infrastructure config files,
- Notebook-based model training artifact.

### 5.6 Methodological Limitations

While implementation quality is strong for educational scope, the project does not yet include full automated end-to-end testing or controlled A/B threshold studies. These are suitable next steps for post-submission enhancement.

---

## 6. Requirements Analysis

### 6.1 Stakeholders

- End User: submits email text and reviews own risk history.
- Administrator: manages user accounts and monitors threat analytics.
- Developer/Operator: deploys environment and verifies runtime behavior.
- Assessor/Supervisor: evaluates technical rigor and report completeness.

### 6.2 Functional Requirements

FR-01: User authentication with role assignment (ADMIN/USER).  
FR-02: Single login flow supporting both roles.  
FR-03: User-side manual email analysis via API.  
FR-04: User-side scan history retrieval.  
FR-05: Admin dashboard summary endpoint and visualization.  
FR-06: Admin user listing, creation, and deletion controls.  
FR-07: Admin threat log retrieval with risk/confidence values.  
FR-08: Admin analytics endpoint for totals, trends, and sender distributions.  
FR-09: Contact form submission recording via audit table.  
FR-10: Health endpoint for operational checks.

### 6.3 Non-Functional Requirements

NFR-01: Clear and actionable error messages for backend/model unavailability.  
NFR-02: Persistent session state between page reloads.  
NFR-03: Responsive UI for major viewports.  
NFR-04: Type-safe codebase and successful build pipeline.  
NFR-05: Minimal divergence between local and hosted API behavior.  
NFR-06: Environment-secret isolation from frontend code.

### 6.4 Security Requirements

SR-01: Admin-only access to management and analytics endpoints.  
SR-02: Password hashing before storage.  
SR-03: No self-signup creation of admin account.  
SR-04: Prevent deletion of admin account through admin panel endpoint.  
SR-05: CORS control and role header checks in API layer.

### 6.5 Data Requirements

DR-01: Persist every analysis with timestamp and probability output.  
DR-02: Associate scans with user IDs when available.  
DR-03: Keep system settings row for threshold and controls.  
DR-04: Persist contact/audit events for traceability.

### 6.6 Constraints and Assumptions

- Inference depends on external HF endpoint availability.
- Role state is currently maintained on client session context, not tokenized API sessions.
- Some legacy documentation still references earlier Gmail integration phase.
- Current delivery prioritizes correctness and transparency over continuity under inference outage.

### 6.7 Requirements Prioritization Using MoSCoW

The requirement set was prioritized using the MoSCoW method to ensure delivery discipline within the project timeline.

Must-have requirements:

- FR-01 to FR-08: core role-based authentication, analysis, history, and admin governance workflows.
- NFR-01, NFR-04, NFR-05: clear failure messaging, type-safe builds, and local-hosted parity.
- SR-01 to SR-04: basic route and identity safeguards.
- DR-01 and DR-02: persistent storage of analysis outputs and user ownership linkage.

Should-have requirements:

- FR-09 and FR-10: contact and health endpoints.
- NFR-03 and NFR-06: responsive UI and secret-handling discipline.
- DR-03 and DR-04: system setting row and audit logging.

Could-have requirements:

- Advanced explainability surfaces at token or phrase level.
- Multi-provider mailbox ingestion workflow.
- Automated model fallback with strict provenance labels.

Won't-have in current delivery:

- Enterprise single sign-on integration.
- Security operations center integration.
- Full multi-tenant isolation and policy orchestration.

This prioritization ensured that project success was defined by end-to-end functional integrity rather than feature volume.

### 6.8 Requirements to Evidence Traceability Matrix

| Requirement ID | Requirement Summary | Implementation Evidence | Validation Evidence |
|---|---|---|---|
| FR-01 | Role-aware authentication | /api/auth/login, AuthContext | Scenario tests 1 and 2 in Chapter 9 |
| FR-03 | Manual email analysis | /api/analyze, UserDashboard | Scenario tests 4 and 12 in Chapter 9 |
| FR-04 | User scan history | /api/user/scans, UserDashboard history table | Scenario test 5 in Chapter 9 |
| FR-05 | Admin summary dashboard | /api/dashboard/summary, admin/Dashboard.tsx | Scenario test 10 in Chapter 9 |
| FR-06 | Admin user management | /api/admin/users routes, UsersManagement.tsx | Scenario tests 6, 7, and 8 in Chapter 9 |
| FR-07 | Threat log visibility | /api/admin/threats, ThreatLog.tsx | Scenario test 9 in Chapter 9 |
| FR-08 | Aggregate analytics | /api/admin/analytics, admin/Analytics.tsx | Scenario test 10 in Chapter 9 |
| NFR-05 | Local and hosted parity | server.ts adapter + netlify/functions/api.ts shared path | Runtime parity review in Chapters 8 and Appendix H |
| SR-02 | Secure password handling | bcrypt hash and compare flow in API | Signup and login scenario tests |
| DR-01 | Persist analysis outcomes | phish_email_scans schema and saveScan helper | History retrieval and admin logs |

The matrix above supports objective evaluation by tying each requirement to both implementation artifact and verification path.

### 6.9 Chapter Conclusion

This chapter defined what the project needed to deliver and why each requirement mattered to stakeholders. The prioritization and traceability matrix ensured that implementation choices remained measurable and auditable. The next chapter translates these requirements into concrete system design decisions and justified architecture trade-offs.

---

## 7. System Design

### 7.1 High-Level Architecture

The architecture consists of four cooperating layers:

1. Presentation Layer: React-based SPA for public pages, user dashboard, and admin console.
2. Application Layer: Netlify function API (TypeScript) with route-dispatch logic.
3. Data Layer: Supabase (Postgres) tables for users, scans, settings, and audit logs.
4. Inference Layer: HF endpoint returning label/probability payloads.

The local runtime uses Express as a transparent adapter to the same function handler, so the application layer logic is not duplicated across environments.

### 7.2 Frontend Routing Design

Route groups are deliberately separated:

- Public layout: home, login, signup, about, contact.
- User protected route: /user dashboard.
- Admin protected route group: /admin with nested overview/users/threats/analytics.

Authorization logic is implemented in route wrappers and admin layout guards, while navigation options are role-sensitive.

### 7.3 API Design Principles

The API is designed for explicitness rather than abstraction-heavy complexity. Route logic is centralized in one handler and segmented by normalized path and method checks. This approach is readable for educational context and simplifies deployment in serverless runtime.

### 7.4 Data Model Design

The Supabase schema uses `phish_*` naming to avoid collision with unrelated tables in shared projects. Key design decisions:

- UUID primary keys for users, scans, and audit logs,
- Optional user linkage in scans,
- Indexed timestamp and phishing flags for query efficiency,
- Trigger-managed updated_at consistency.

### 7.5 Security Design

Security controls are layered:

- Password hash verification with bcryptjs,
- API role checks via request headers for admin routes,
- Admin bootstrap protection in signup/create/delete flows,
- CORS origin handling with allowlist support,
- Separation of environment secrets from client bundle.

### 7.6 Error and Failure Design

The design explicitly surfaces model unavailability rather than masking it. Backend throws and returns a clear message when HF inference is unavailable. Frontend displays this error without synthetic fallback classification. This design protects user trust and preserves evaluation validity.

### 7.7 Deployment Design

Netlify routing maps `/api/*` to the serverless function path and falls back to SPA index for UI routes. Local development uses `tsx server.ts`, where Express proxies `/api` requests to the same handler. This creates a single behavioral source of truth.

### 7.8 Design Alternatives Considered and Rejected

The final design was selected after comparing practical alternatives.

Alternative 1: Separate local backend implementation (Express routes duplicated from serverless handler).  
Reason rejected: this introduces logic drift risk and doubles maintenance burden.

Alternative 2: Multi-service backend split (auth service, analysis service, analytics service).  
Reason rejected: architecture overhead was disproportionate to project scope and timeline.

Alternative 3: Client-side fallback heuristic scoring on model failure.  
Reason rejected: this can mislead users during outages and distort evaluation integrity.

Alternative 4: No persistent storage, in-memory analysis only.  
Reason rejected: this would remove trend visibility, reduce reproducibility, and weaken admin governance.

Alternative 5: Route-level micro-frontend design for role isolation.  
Reason rejected: high implementation complexity for limited educational benefit in current scope.

The chosen design therefore emphasizes maintainability, transparency, and submission reliability over architectural novelty.

### 7.9 Chapter Conclusion

The design chapter translated requirements into a deployable and testable architecture. Core decisions, including centralized API dispatch, parity-preserving local adapter, and explicit failure semantics, were justified against feasible alternatives. The next chapter documents how these decisions were implemented at code, route, and data levels.

---

## 8. Implementation

### 8.1 Frontend Application Implementation

The frontend is built with React and TypeScript. It uses componentized page architecture, route protection, and chart-based data display for administrator workflows. Styling combines Tailwind and custom theme tokens for consistent visual identity.

Public pages include:

- Home: feature showcase and live demo submission.
- About: project rationale and mission.
- Contact: API-backed form submission.
- Login/Signup: unified auth workflow.

Role-specific pages include:

- User dashboard for manual analysis and personal scan history.
- Admin dashboard for summary metrics and threat distribution.
- Admin user management and threat log pages.
- Admin analytics page for trend and sender-level insights.

### 8.2 Backend API Implementation

The backend runtime is implemented in `netlify/functions/api.ts`. It performs route normalization, CORS handling, body parsing, role checks, and DB operations. The same code handles both hosted function calls and local development proxy calls.

Key API groups:

- Health and contact operations,
- Authentication endpoints,
- Analysis and scan retrieval endpoints,
- Admin management and analytics endpoints.

### 8.3 Local Runtime Adapter

`server.ts` is intentionally minimal and acts as an adapter rather than duplicate backend. It converts Express request shape into a Netlify-event-compatible payload and forwards execution to the function handler. This avoids drifting logic between local and deployed code.

### 8.4 Data Layer Implementation

`supabase/schema_and_seed.sql` provides schema and baseline seed data. The API lazily initializes a Supabase client with service-role key support and includes helper functions for:

- Ensuring default admin account,
- Loading settings,
- Persisting scans,
- Querying recent and filtered scans.

### 8.5 Authentication and Authorization Implementation

Auth is implemented in two layers:

- Backend identity verification via login/signup with hashed passwords.
- Frontend session persistence via localStorage-backed auth context.

Authorization is role-based:

- Admin pages redirect non-admins.
- Admin API endpoints reject non-admin role headers.
- Signup path blocks admin creation.

### 8.6 Inference and Result Handling

The analysis pipeline sends normalized text to HF endpoint and expects probabilistic output. The backend translates payloads into a normalized schema with label, confidence, and phishing probability, then persists records to DB.

The latest correction removed heuristic result generation. If inference cannot be completed, the system returns the explicit message: "model is sleeping at HF."

### 8.7 Dashboard and Analytics Logic

Admin summary logic computes:

- 24-hour scan totals,
- blocked threat count,
- false-positive proxy metric,
- bucketized chart data,
- top threat categories,
- recent threat list.

Analytics logic computes:

- global totals (users/scans/threats),
- threat rate,
- 14-day scans vs threats line data,
- top malicious senders.

### 8.8 Complete File-by-File Purpose Walkthrough

This subsection documents the practical purpose of each major source artifact reviewed.

#### 8.8.1 Root Configuration and Project Metadata

- `package.json`: declares dependencies, scripts, runtime entry points (`dev`, `build`, `start`, `lint`).
- `package-lock.json`: deterministic dependency lock for reproducible installs.
- `tsconfig.json`: TypeScript compile target, JSX mode, module resolution, no-emit type-check behavior.
- `vite.config.ts`: Vite plugin setup, alias mapping, optional HMR controls.
- `netlify.toml`: Netlify build settings and critical API redirect mapping.
- `index.html`: SPA bootstrap HTML, app metadata, favicon and root mount node.
- `metadata.json`: lightweight project metadata scaffold.
- `.env.example`: template environment variable contract for deployment and local setup.
- `.gitignore`: excludes secrets, model weights, docs workspace artifacts, generated folders.
- `README.md`: operational setup guide and deployment instructions (contains some legacy references from earlier integration phase).
- `memory.md`: project evolution log documenting iterative changes and historical decisions.

#### 8.8.2 Backend Runtime Files

- `netlify/functions/api.ts`: core application backend; route dispatch, auth, analysis, admin operations, DB interaction.
- `server.ts`: local Express proxy that forwards API calls to `api.ts` for environment parity.

#### 8.8.3 Database and Persistence Files

- `supabase/schema_and_seed.sql`: table creation, indexes, triggers, default seed records.

#### 8.8.4 Frontend Entry and Global Styling

- `src/main.tsx`: React root creation and app mount.
- `src/App.tsx`: route architecture, public/admin/user layouts, route guards.
- `src/index.css`: theme variables, fonts, global visual styling, custom scrollbar.
- `src/vite-env.d.ts`: typed frontend environment variables.

#### 8.8.5 Frontend Utility and Context Modules

- `src/contexts/AuthContext.tsx`: user session model, role typing, localStorage persistence, auth hooks.
- `src/lib/api.ts`: API URL resolver and user-facing error message utility.
- `src/lib/utils.ts`: className merge helper (`cn`) combining `clsx` and `tailwind-merge`.

#### 8.8.6 Frontend Shared Components

- `src/components/Navbar.tsx`: public top navigation with auth-state-aware actions.
- `src/components/Footer.tsx`: static footer links and branding.
- `src/components/AdminLayout.tsx`: admin shell with sidebar navigation, top bar, and auth enforcement.

#### 8.8.7 Frontend Public Pages

- `src/pages/Home.tsx`: marketing sections + live analysis demo submission workflow.
- `src/pages/About.tsx`: project motivation and contextual overview page.
- `src/pages/Contact.tsx`: API-backed contact submission form.
- `src/pages/Login.tsx`: single login form with role-based redirect.
- `src/pages/SignUp.tsx`: user account creation form for standard role onboarding.

#### 8.8.8 Frontend Admin Pages

- `src/pages/admin/Dashboard.tsx`: summary cards, chart visualization, and recent threat table.
- `src/pages/admin/Analytics.tsx`: aggregate trend charts and sender distribution analytics.
- `src/pages/admin/ThreatLog.tsx`: detailed threat history list with risk/confidence.
- `src/pages/admin/UsersManagement.tsx`: user CRUD controls with admin constraints.

#### 8.8.9 Frontend User Pages

- `src/pages/user/UserDashboard.tsx`: manual analysis form and user-specific history table.

#### 8.8.10 Model and Training Artifacts

- `Model/phishing-detection-training-v2.ipynb`: full training and evaluation pipeline for ModernBERT-based classifier.
- `Model/tokenizer_config.json`: tokenizer runtime settings used for inference packaging.
- `Model/tokenizer.json`: tokenizer vocabulary and model serialization data.
- `Model/.cache/huggingface/upload/*.metadata`: upload metadata and checksum records for model artifacts.

#### 8.8.11 Supporting Documentation and Legacy Prototype

- `docs/diagrams/README.md`: sequence diagram manifest for major system interactions.
- `docs/diagrams/*.drawio`: interaction-flow diagrams.
- `private_docs/abstract-problem-intro.md`: report drafting text blocks.
- `private_docs/training-objectives-execution.md`: objective completion mapping notes.
- `private_docs/flask_prototype/app.py`: earlier standalone prototype API, useful for objective traceability.
- `private_docs/flask_prototype/requirements.txt`: dependencies for Flask prototype.
- `private_docs/PhishBERT_COMP1682_Final_Report_Draft.md`: earlier report draft.
- `private_docs/PhishBERT_COMP1682_Final_Report_Complete.md`: prior complete report version and template-aligned structure.
- `private_docs/README.md`: local-only documentation folder guidance.

### 8.9 Model Training Notebook Implementation Summary

The notebook includes a complete ML workflow:

1. Imports and environment checks,
2. Configuration and reproducibility settings,
3. Multi-source dataset loading and standardization,
4. Deduplication and cleaning,
5. Stratified split and cross-corpus holdout,
6. Tokenization and custom dataset class,
7. Weighted sampling for class balance,
8. ModernBERT classifier definition,
9. Optimizer/scheduler/scaler setup,
10. Training and validation loops,
11. Standard and cross-corpus evaluation,
12. Confusion matrix and ROC plotting,
13. Final model/tokenizer export,
14. Inference helper function.

This notebook demonstrates that the project is supported by a coherent model-training artifact rather than only a deployed endpoint reference.

### 8.10 Implementation Integrity Notes

A key integrity improvement in the latest code is the removal of runtime heuristic scoring fallback in both backend and home demo path. This means all production-facing classifications are model-derived, and outages are explicitly communicated. This design is academically stronger for evaluation because it prevents silent contamination of measured behavior by synthetic rules.

### 8.11 Chapter Conclusion

The implementation delivers a coherent full-stack artifact in which frontend workflows, backend controls, persistence, and model integration are aligned. The strongest implementation achievement is not merely endpoint completeness, but reliable behavior under both normal and degraded runtime conditions. The next chapter evaluates this implementation through scenario-based testing and objective critical analysis.

---

## 9. Testing and Evaluation

### 9.1 Testing Approach

Testing combined static and functional verification:

- Type checks via TypeScript compiler,
- Production build verification via Vite,
- Endpoint-level validation for user and admin operations,
- Access-control validation on protected routes,
- Runtime verification of local proxy startup and API forwarding.

### 9.2 Static Validation

The project repeatedly validated with `npm run lint` (tsc no-emit) and `npm run build`. This ensured that code changes in role flow, backend routes, and error messaging remained compile-safe.

### 9.3 Functional Scenario Evaluation

Representative scenarios tested:

1. Login with admin credentials routes to admin dashboard.
2. Login with user credentials routes to user dashboard.
3. Signup creates only USER accounts.
4. User can submit manual text and receive model score when endpoint is reachable.
5. User history endpoint returns user-specific scans.
6. Admin users list returns all accounts with scan counts.
7. Admin create-user endpoint creates only non-admin users.
8. Admin delete-user blocks admin-account deletion.
9. Admin threat logs show phishing-only entries.
10. Admin analytics endpoint returns totals, trend data, and top sender distribution.
11. Contact endpoint stores message metadata in audit table.
12. When HF endpoint fails, analysis returns explicit sleep message rather than synthetic score.

### 9.4 Evaluation Interpretation

From a systems perspective, the project now emphasizes output integrity and role safety over uninterrupted demo continuity. This is desirable for a report-backed security tool because fabricated fallback outputs can hide model outages and corrupt trust.

The model notebook indicates robust evaluation intent, including cross-corpus testing. In report defense, this should be highlighted as evidence of generalization-aware methodology rather than single-split overfitting.

### 9.5 Known Testing Gaps

- Automated API integration tests are not yet implemented.
- No CI pipeline currently enforces lint/build/test on push.
- No dedicated load/performance benchmark for analytics endpoints.
- No tokenized server-side user session implementation; current role context relies on client persistence.

### 9.6 Suggested Advanced Evaluation Extensions

For post-submission maturation, recommended evaluation additions include:

- Precision/recall calibration across threshold sweep,
- False-positive cost analysis on clean-email benchmark sets,
- Adversarial prompt robustness checks,
- End-to-end deterministic test harness for route-level regression.

### 9.7 Evaluation Against Aim and Objectives

The stated aim was to build and evaluate a complete phishing detection platform combining contextual inference with secure workflows and analytics. The objective-level evaluation is summarized below.

Objective 1: Review phishing methods and implementation gaps.  
Status: achieved. Chapters 2 and 3 provide comparative analysis and motivate contextual NLP plus deployment-aware engineering.

Objective 2: Build robust backend API for analysis and governance.  
Status: achieved. Core endpoints for analysis, history, admin controls, and analytics are implemented and validated.

Objective 3: Implement role-based frontend journeys.  
Status: achieved. User and admin route groups are separated with protected wrappers and role-aware navigation.

Objective 4: Design and deploy persistence schema.  
Status: achieved. Supabase schema, indexes, trigger updates, and seed data are provided and operational.

Objective 5: Integrate model inference endpoint.  
Status: achieved with operational constraint. Inference works when endpoint is reachable and degrades explicitly when unavailable.

Objective 6: Ensure local-hosted behavior parity.  
Status: achieved. Shared handler strategy materially reduces environment mismatch risk.

Objective 7: Produce complete technical documentation.  
Status: achieved. This report, appendices, and diagrams provide traceable evidence for architecture, implementation, testing, and reflection.

Overall objective attainment is strong, with principal residual risk concentrated in runtime dependency on external inference availability and the absence of tokenized session hardening.

### 9.8 Chapter Conclusion

Evaluation results indicate that the project meets its stated objectives at the level expected for a final-year software engineering deliverable. The implementation is operationally coherent, security-aware for its scope, and transparent about limitations. The next chapter extends this analysis through deeper critical appraisal of trade-offs and future risk.

---

## 10. Critical Appraisal

### 10.1 Technical Strengths

1. Clear separation of concerns between UI, API, and persistence.
2. Unified local/hosted API behavior through function-handler proxying.
3. Strong role-specific workflow design.
4. Simple but effective data model for analysis and reporting.
5. Transparent model-unavailability handling.

### 10.2 Design Trade-Offs

The project intentionally chooses simplicity in certain areas:

- Single-file API route dispatch improves readability but may become large over time.
- Client-side auth context is easy to manage but not equivalent to hardened token architecture.
- Direct role-header admin checks are practical for current scope but should evolve toward signed identity claims.

### 10.3 Operational Strengths

The most valuable operational decision is minimizing environment drift. Many final-year systems pass local tests but fail in deployment due to architecture mismatch. By using one function handler in both local and hosted contexts, this project substantially reduces that risk.

### 10.4 Risks and Limitations

1. External model endpoint is a single point of inference dependency.
2. Legacy docs still reference deprecated fallback and integration concepts.
3. Dashboard search UI in admin layout is currently cosmetic, not query-connected.
4. No paginated API strategy yet for large history datasets.

### 10.5 Ethical Reflection

The removal of heuristic fallback is not only a technical decision; it is an ethical one. Security users should not be shown fabricated confidence during outage conditions. The current message-driven failure mode prioritizes trust and truthful system state representation.

### 10.6 Reflection on Research-to-Engineering Transition

The notebook demonstrates ML capability, but this project's main value is in turning that capability into a coherent software product. Handling auth, persistence, role separation, route protection, and deployment constraints is where most practical complexity occurs. This transition is the strongest demonstration of software engineering maturity in the project.

---

## 11. Conclusion and Future Work

PhishBERT, in its current implementation, successfully delivers a practical phishing detection application with role-aware workflows, persistent scan telemetry, and operational analytics. The system is not merely a model wrapper; it is a complete software product that integrates frontend interaction, backend routing, cloud persistence, and deployment-conscious architecture.

The codebase demonstrates:

- Functional ADMIN and USER journeys,
- Unified development/production API logic,
- Structured Supabase schema and seedability,
- Model-driven analysis with explicit failure semantics,
- Comprehensive source artifacts suitable for technical reporting.

Future work directions include:

1. Server-side session tokens and stronger identity verification.
2. Event-driven inbox ingestion (webhooks/subscriptions) where provider support exists.
3. CI-integrated automated tests.
4. Advanced explainability (token attribution or rationale highlighting).
5. Policy-based threshold configuration by user/tenant.
6. Multi-model fallback strategy that preserves correctness without heuristic fabrication.
7. Migration of legacy documentation to align with current runtime architecture.

In conclusion, the project provides a strong final-year demonstration of applied AI engineering where architecture and operational integrity are treated as first-class goals alongside model performance.

---

## 12. References

APWG (2024) Phishing activity trends report, 4Q 2023. APWG [online]. Available at: https://apwg.org/trendsreports/ (Accessed: 16 April 2026).

Arrieta, A.B., Diaz-Rodriguez, N., Del Ser, J., Bennetot, A., Tabik, S., Barbado, A., Garcia, S., Gil-Lopez, S., Molina, D., Benjamins, R., Chatila, R. and Herrera, F. (2020) Explainable Artificial Intelligence (XAI): Concepts, taxonomies, opportunities and challenges toward responsible AI. Information Fusion, 58, pp. 82-115.

Brown, T.B., Mann, B., Ryder, N., Subbiah, M., Kaplan, J., Dhariwal, P., Neelakantan, A., Shyam, P., Sastry, G., Askell, A., Agarwal, S., Herbert-Voss, A., Krueger, G., Henighan, T., Child, R., Ramesh, A., Ziegler, D., Wu, J., Winter, C., Hesse, C., Chen, M., Sigler, E., Litwin, M., Gray, S., Chess, B., Clark, J., Berner, C., McCandlish, S., Radford, A., Sutskever, I. and Amodei, D. (2020) Language models are few-shot learners. Advances in Neural Information Processing Systems, 33, pp. 1877-1901.

Devlin, J., Chang, M.W., Lee, K. and Toutanova, K. (2019) BERT: Pre-training of deep bidirectional transformers for language understanding. Proceedings of NAACL-HLT 2019, pp. 4171-4186.

ENISA (2023) ENISA threat landscape 2023. European Union Agency for Cybersecurity [online]. Available at: https://www.enisa.europa.eu/ (Accessed: 16 April 2026).

Fette, I., Sadeh, N. and Tomasic, A. (2007) Learning to detect phishing emails. Proceedings of the 16th International Conference on World Wide Web, pp. 649-656.

Goodfellow, I., Bengio, Y. and Courville, A. (2016) Deep Learning. Cambridge, MA: MIT Press.

ISO (2022) ISO/IEC 27001:2022 Information security, cybersecurity and privacy protection - Information security management systems - Requirements. Geneva: International Organization for Standardization.

Khonji, M., Iraqi, Y. and Jones, A. (2013) Phishing detection: A literature survey. IEEE Communications Surveys and Tutorials, 15(4), pp. 2091-2121.

Microsoft (2024) Microsoft digital defense report 2024. Microsoft Security [online]. Available at: https://www.microsoft.com/security/business/microsoft-digital-defense-report (Accessed: 16 April 2026).

Manning, C.D., Raghavan, P. and Schutze, H. (2008) Introduction to Information Retrieval. Cambridge: Cambridge University Press.

Netlify (n.d.) Netlify Functions documentation [online]. Available at: https://docs.netlify.com/functions/overview/ (Accessed: 16 April 2026).

NCSC (2024) Phishing attacks: Defending your organisation [online]. National Cyber Security Centre. Available at: https://www.ncsc.gov.uk/collection/phishing-scams (Accessed: 16 April 2026).

Nielsen, J. (1994) Usability Engineering. San Francisco: Morgan Kaufmann.

NIST (2020) Digital identity guidelines: Authentication and lifecycle management (SP 800-63B). Gaithersburg, MD: National Institute of Standards and Technology.

NIST (2023) Artificial Intelligence Risk Management Framework (AI RMF 1.0). Gaithersburg, MD: National Institute of Standards and Technology.

Parsons, K., McCormac, A., Butavicius, M., Pattinson, M. and Jerram, C. (2019) Determining employee awareness using the Human Aspects of Information Security Questionnaire (HAIS-Q). Computers and Security, 42, pp. 165-176.

OWASP Foundation (2021) OWASP Application Security Verification Standard 4.0.3 [online]. Available at: https://owasp.org/www-project-application-security-verification-standard/ (Accessed: 16 April 2026).

Sahoo, D., Liu, C. and Hoi, S.C.H. (2019) Malicious URL detection using machine learning: A survey. ACM Computing Surveys, 52(1), pp. 1-36.

Sheng, S., Holbrook, M., Kumaraguru, P., Cranor, L.F. and Downs, J. (2010) Who falls for phish? A demographic analysis of phishing susceptibility and effectiveness of interventions. Proceedings of the SIGCHI Conference on Human Factors in Computing Systems, pp. 373-382.

Provos, N. and Mazières, D. (1999) A future-adaptable password scheme. USENIX Annual Technical Conference.

React Team (n.d.) React documentation [online]. Available at: https://react.dev/ (Accessed: 16 April 2026).

Supabase (n.d.) Supabase documentation [online]. Available at: https://supabase.com/docs (Accessed: 16 April 2026).

Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A.N., Kaiser, L. and Polosukhin, I. (2017) Attention is all you need. Advances in Neural Information Processing Systems, 30, pp. 5998-6008.

Vite Team (n.d.) Vite documentation [online]. Available at: https://vite.dev/guide/ (Accessed: 16 April 2026).

W3C (2023) Web Content Accessibility Guidelines (WCAG) 2.2 [online]. Available at: https://www.w3.org/TR/WCAG22/ (Accessed: 16 April 2026).

---

## 13. Appendices

### Appendix A: Objective-to-Artifact Traceability

| Objective | Implementation Evidence | Status |
|---|---|---|
| Literature and context review | Chapters 2, 3, 4; private docs draft notes | Completed |
| Backend analysis pipeline | netlify/functions/api.ts | Completed |
| Role-based frontend workflows | src/App.tsx, src/contexts/AuthContext.tsx, page modules | Completed |
| Persistence and schema | supabase/schema_and_seed.sql | Completed |
| Model integration | HF endpoint path + notebook + tokenizer artifacts | Completed |
| Deployment hardening | netlify.toml, server.ts proxy alignment | Completed |
| Reporting and artifacts | this draft + diagram manifests + private docs | Completed |

### Appendix B: Deployment Environment Checklist

Frontend:

- VITE_API_BASE_URL
- VITE_HF_FALLBACK_URL (optional in current runtime path)

Backend:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (preferred)
- SUPABASE_ANON_KEY (fallback option)
- HF_PHISHING_API_URL
- CORS_ORIGIN
- DEFAULT_ADMIN_EMAIL
- DEFAULT_ADMIN_PASSWORD

### Appendix C: Runtime Endpoint Map

Public and shared endpoints:

- GET /api/health
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/analyze
- GET /api/scans/recent
- GET /api/user/scans
- POST /api/contact

Admin endpoints:

- GET /api/dashboard/summary
- GET /api/admin/users
- POST /api/admin/users
- DELETE /api/admin/users/:id
- GET /api/admin/threats
- GET /api/admin/analytics

### Appendix D: Figure Insertion Plan

Suggested figure locations during final Word formatting:

1. Architecture block diagram in Chapter 7.
2. Route map screenshot in Chapter 8.
3. Admin dashboard screenshot in Chapter 8.
4. User dashboard screenshot in Chapter 8.
5. Supabase schema/table screenshot in Chapter 8.
6. Analysis error message screenshot (model sleeping state) in Chapter 9.
7. Notebook evaluation plots (confusion matrix, ROC) in Chapter 9.

### Appendix E: Notes on Legacy vs Current Architecture

The repository contains historical documentation and diagram artifacts from earlier phases that included Gmail/Outlook integration concepts and heuristic fallback behavior. The current runtime code reviewed in this report has removed those paths from active analysis flow and now implements strict model-backed output with explicit unavailability messaging.

### Appendix F: Extended Technical Commentary (Deep File-by-File Analysis)

This appendix extends the implementation chapter with deeper narrative analysis at file level. The objective of this appendix is to make code-review evidence explicit for report examiners who require traceability from architecture claims to concrete source artifacts.

#### F.1 Root-Level Configuration and Bootstrapping Files

The root of the workspace acts as the project control plane. Although root files are sometimes treated as secondary compared to application code, they define build behavior, runtime safety, deployment assumptions, and reproducibility constraints. For this reason, each root file should be interpreted as part of the system design rather than as peripheral metadata.

`package.json` is the runtime contract. It defines the script entry points and the dependency graph shape expected by the project. The `dev` command launches `tsx server.ts`, which means local execution is not Vite-only: the API adapter boots first and then mounts Vite middleware. This design is important because API and frontend coexist on one origin in development. The `build` script delegates to `vite build`, while `start` uses Node experimental TypeScript stripping for runtime execution. `lint` runs TypeScript type-checking without emit, creating a static quality gate.

Dependency choices in `package.json` reveal architectural intent. `@supabase/supabase-js` confirms cloud DB coupling. `bcryptjs` indicates password-hash validation in auth routes. `express` exists for local runtime adaptation. `motion`, `recharts`, and `lucide-react` support dashboard UX and visual storytelling. `googleapis` remains installed from earlier integration phases; this is a useful observation for technical debt commentary, because package-level history may outlive active runtime usage.

`package-lock.json` supports deterministic installation. In academic projects, this is often overlooked; however, deterministic dependency state is critical for reproducible marking environments. Without lockfile discipline, two machines can produce different transitive versions and inconsistent behavior.

`tsconfig.json` reflects frontend-centric TypeScript behavior with bundler resolution and no emit. The project compiles through Vite and checks types as a standalone step. This separation is a practical workflow pattern because build speed and type strictness can be tuned independently.

`vite.config.ts` wires React and Tailwind plugins, aliasing, and optional HMR behavior. The comment around HMR suggests adaptation for tooling environments where auto-reload may cause instability during AI-assisted edits. This is an implementation detail with process significance: the team optimized developer experience for mixed human/agent workflows.

`netlify.toml` encodes production route behavior. Its `/api/*` redirect into Netlify function path is central to hosted API functionality. Without this redirect, frontend calls to `/api` would never reach backend logic in static hosting. The second redirect (`/*` to `/index.html`) enforces SPA behavior.

`index.html` contributes metadata quality (description, title, favicon). These details matter for professional polish and user trust, especially in security software where visual legitimacy can affect adoption.

`.env.example` is a contract for runtime requirements. It documents which values are mandatory, optional, and environment-specific. The explicit inclusion of backend URL and CORS hints shows awareness that deployment misconfiguration is a common failure mode.

`.gitignore` demonstrates security hygiene: environment secrets and local planning artifacts are excluded. Notably, `private_docs/` and `memory.md` are local-only by policy, indicating separation between submission-grade code and planning/reporting workspace.

`README.md` serves as operational onboarding. It includes setup, Supabase schema flow, and deployment guidance. The presence of legacy notes is itself a useful analytic point: documentation must be continuously synchronized with current runtime architecture to avoid user confusion.

#### F.2 Backend Route-by-Route Behavioral Analysis

The core backend in `netlify/functions/api.ts` is designed as a single-dispatch serverless function. This approach has trade-offs: large file size versus centralized readability. For this project scale, centralized dispatch improves maintainability because all route logic and helper functions are visible in one place.

Bootstrap helpers:

- `getDb()` enforces Supabase configuration presence and lazy client initialization.
- `resolveCorsOrigin()` and `corsHeaders()` enforce origin behavior and header exposure.
- `parseBody()` handles raw payload parsing with base64 safety.
- `normalizeRoute()` strips `/api` and function prefixes for route consistency.

These helpers are foundational: they convert environment-level concerns into predictable input for route logic.

Model processing helpers:

- `normalizeHFAnalysis()` standardizes model output shape regardless of slight response variations.
- `analyzeEmailAsync()` wraps external inference call and now intentionally throws explicit unavailability message when the model is unreachable or non-OK.

This explicit throw behavior is the strongest reliability-integrity decision in the latest codebase iteration. It prevents accidental synthetic predictions that can pollute analytics and user perception.

Persistence helpers:

- `getSystemSetting()` ensures a settings row exists and supports default initialization.
- `saveScan()` persists analysis outputs and converts probabilistic score to binary label via threshold.
- `getRecentScans()` provides filtered retrieval for user and admin pages.

Security and admin helpers:

- `ensureDefaultAdmin()` guarantees one admin account is present.
- `isAdminRequest()` checks role header for admin route access.
- `normalizeUserRole()` canonicalizes role values.

Route behavior analysis:

`GET /health` returns service status and default admin credentials. From a production-security perspective, exposing default credentials in health payload is acceptable for controlled educational deployment but should be removed or restricted in hardened environments.

`POST /analyze` validates subject/sender/text, calls HF inference, persists result, and returns normalized payload with threshold and classification fields. This route is central to both home demo and user dashboard.

`GET /scans/recent` provides generic recent scan list. `GET /user/scans` adds required user filter and guards for missing query input.

`GET /dashboard/summary` is admin-restricted and computes 24-hour aggregate metrics with time buckets. It also builds threat-type distribution and recent threat list. This endpoint allows the dashboard page to render a dense visual summary with a single API call.

`GET /admin/users`, `POST /admin/users`, and `DELETE /admin/users/:id` implement admin user lifecycle controls. They include meaningful constraints: admin role creation is blocked through create-user route, and admin deletion is blocked through delete route.

`GET /admin/threats` returns phishing-only scans for operational review.

`GET /admin/analytics` computes totals, trend lines, and top sender map over a 14-day window. Its data-shaping strategy directly matches frontend chart expectations.

`POST /auth/signup` and `POST /auth/login` handle credential paths. Signup enforces USER role and minimum password length. Login verifies hash and returns minimal role identity payload.

`POST /contact` stores structured contact message data in audit logs.

Fallback route returns 404 JSON, while top-level catch returns 500 JSON with normalized message extraction.

Local adapter analysis (`server.ts`):

`server.ts` is intentionally concise. It normalizes Express request headers/query/body into Netlify event shape and calls `apiHandler` directly. This design means local tests and hosted function logic share one executable code path. The value is substantial: fewer hidden differences, faster bug localization, and cleaner report defensibility for deployment behavior.

#### F.3 Frontend Architecture and UX Deep Analysis

The frontend uses clear role-separation design. `src/App.tsx` creates two protected wrappers:

- `ProtectedAdminRoute` ensures authentication and admin role.
- `ProtectedUserRoute` ensures authentication and non-admin role.

This is a straightforward but effective access model for two-role systems.

The `AuthContext` in `src/contexts/AuthContext.tsx` stores user object and persists it in localStorage. It offers `isAuthenticated` and `isAdmin` derived state. This design is easy to reason about and suitable for educational scope; however, future hardening should replace role-trust-at-client with server-issued signed session assertions.

`src/lib/api.ts` centralizes endpoint construction and deployment-aware error messaging. This prevents repeated URL logic and keeps UI messaging consistent. The helper `getApiErrorMessage` is particularly valuable because it transforms network and status failures into actionable hints for configuration.

Shared components:

- `Navbar.tsx` changes call-to-action based on auth role and state.
- `Footer.tsx` provides lightweight project identity and navigation anchors.
- `AdminLayout.tsx` defines persistent admin shell, sidebar nav, and topbar identity context.

Public pages:

`Home.tsx` is both marketing and operational entry point. Its demo section submits analysis requests to `/api/analyze`, displays confidence/risk outputs, and now shows explicit error when model is unavailable. It no longer silently routes into synthetic fallback scoring.

`About.tsx` and `Contact.tsx` focus on communication and project framing. `Contact.tsx` is API-active and contributes traceability via audit logs.

Auth pages:

`Login.tsx` implements single login path for both roles and navigates by returned role identity. It includes visible default admin hint text for controlled demonstration settings.

`SignUp.tsx` creates standard user accounts via `/api/auth/signup` and enforces minimum password expectation through both frontend and backend validation.

User page:

`src/pages/user/UserDashboard.tsx` is designed as a practical analyst-lite interface for standard users. It supports manual text submission and historical review. The page sends user ID to backend for association and pulls user-specific history records.

Admin pages:

`Dashboard.tsx` fetches periodic summary data and renders card + chart + table blocks. It includes loading skeleton behavior and relative-time rendering for recent threats.

`UsersManagement.tsx` handles list/create/delete admin operations with role constraints and post-action refresh.

`ThreatLog.tsx` presents structured phishing-only history in tabular form with risk/confidence context.

`Analytics.tsx` renders 14-day line trend and top sender bar chart using Recharts.

Styling and design system:

`index.css` defines thematic neon palette and typography families. Visual consistency across pages is achieved through shared utility classes and explicit color tokens.

Overall frontend quality assessment:

The frontend demonstrates coherent navigation, role separation, and chart integration. It could be improved through component extraction for repeated table/card patterns and stronger form schema validation. Nevertheless, current structure is clear, navigable, and aligned with project objectives.

#### F.4 Data and SQL Implementation Deep Dive

The schema file `supabase/schema_and_seed.sql` is noteworthy for being both setup and teaching artifact. It defines core tables with sane defaults and moderate indexing.

`phish_users`:

- UUID primary key,
- unique email,
- role and timestamps,
- update trigger support.

`phish_email_scans`:

- optional user relation,
- unique source email identifier,
- provider/source descriptors,
- probabilistic and binary classification fields,
- request tracking and timestamp,
- indexes on timestamp and is_phishing.

`phish_system_settings`:

- singleton row by default ID,
- threshold and optional control fields,
- legacy integration fields retained in schema.

`phish_audit_logs`:

- generic action + details log suitable for contact and operational events.

The trigger function `set_updated_at` is a good normalization pattern and prevents timestamp inconsistency in mutable records.

Seed data includes default settings row, admin user, two sample scans, and one bootstrap audit log entry. This improves first-run demonstration flow and supports quick verification after schema execution.

#### F.5 Model Notebook and ML Workflow Commentary

The notebook `Model/phishing-detection-training-v2.ipynb` is large and structured with clearly labeled cells from dependency import to final inference demo. Its workflow demonstrates methodological seriousness in several dimensions:

1. Multi-source dataset merge across phishing and legitimate corpora.
2. Explicit deduplication to reduce leakage risk.
3. Cross-corpus holdout evaluation beyond random split.
4. Weighted sampler class balancing appropriate for transformer input.
5. Mixed precision and scheduler usage for efficient training.
6. Reporting via confusion matrix and ROC curves.

The configuration block targets `answerdotai/ModernBERT-base`, max sequence length 512, and controlled training settings (epochs, warmup, weight decay, gradient accumulation).

Data preparation includes:

- text combination from subject/body/date/sender fields,
- cleaning for MIME artifacts, HTML remnants, and control characters,
- char-length screening after cleaning.

Model construction uses a simple classifier head over contextual representation, which is a standard and defensible approach for binary email classification.

Evaluation captures both standard split metrics and cross-corpus results. This is significant for academic rigor because it addresses generalization rather than purely in-distribution accuracy.

Inference utility function at notebook end is production-oriented and designed to be embedded into API services. This bridges experimentation and operationalization.

Tokenizer artifacts (`tokenizer_config.json`, `tokenizer.json`) complete deployment package assumptions. The config indicates token backend and max-length metadata.

#### F.6 Documentation and Artifact Governance Commentary

Documentation in this repository is split across public and private scopes:

- Public README and diagram index for setup and architecture communication.
- Private docs for report drafting, objective mapping, and iterative planning.

This separation is pragmatic for educational workflows where submission code and in-progress report content have different versioning/privacy requirements.

The existence of earlier drafts (`PhishBERT_COMP1682_Final_Report_Draft.md`, `..._Complete.md`) and objective log (`training-objectives-execution.md`) provides historical traceability. In final submission practice, these artifacts can support viva defense by showing development evolution and rationale behind architecture changes.

One governance improvement recommended post-submission is to align all user-facing documentation with the current runtime architecture, especially where older texts still mention deprecated fallback and integration behavior.

### Appendix G: Extended Testing Matrix, Risk Register, and Acceptance Criteria

This appendix provides expanded verification detail suitable for technical appendix inclusion.

#### G.1 Extended Functional Test Matrix

| ID | Scenario | Input | Expected Result | Observed Risk |
|---|---|---|---|---|
| FT-01 | Signup valid user | new email + password>=8 | 201 + USER account created | duplicate email path not tested with race conditions |
| FT-02 | Signup admin email blocked | default admin email | 403 with explicit message | relies on exact email match |
| FT-03 | Login valid admin | seeded admin credentials | 200 role ADMIN | depends on DB availability |
| FT-04 | Login valid user | created user credentials | 200 role USER | none significant |
| FT-05 | Login invalid password | wrong password | 401 invalid credentials | brute-force protections not implemented |
| FT-06 | Analyze valid text | subject/sender/body | 200 with score payload | external model latency variability |
| FT-07 | Analyze empty text | blank text | 400 validation error | frontend still allows empty sender/subject defaults |
| FT-08 | Analyze when HF unavailable | valid payload | 500 error model sleeping at HF | expected behavior by design |
| FT-09 | User history retrieval | userId + limit | list of that user scans | depends on userId trust from client |
| FT-10 | Admin users list with admin header | x-user-role ADMIN | full list + counts | header spoofing possible without token auth |
| FT-11 | Admin users list without admin header | missing/USER header | 403 | correct guard |
| FT-12 | Admin create user | email + password | 201 + USER account | no password complexity policy beyond length |
| FT-13 | Admin delete user | non-admin user id | 200 ok | accidental deletion possible without confirmation backend token |
| FT-14 | Admin delete admin | admin id | 400 cannot delete | correct guard |
| FT-15 | Dashboard summary admin access | admin header | 200 stats payload | false positive metric currently heuristic proxy |
| FT-16 | Dashboard summary user access | user header | 403 | correct guard |
| FT-17 | Threat log retrieval | admin header | phishing-only records | pagination absent |
| FT-18 | Analytics retrieval | admin header | totals + 14-day series + top senders | heavy query risk on large data |
| FT-19 | Contact form valid | name/email/message | 201 and audit insert | no anti-spam throttling |
| FT-20 | API not found route | unknown path | 404 JSON | correct fallback |

#### G.2 Non-Functional Validation Matrix

| ID | NFR | Validation Method | Expected | Current Status |
|---|---|---|---|---|
| NFR-01 | Type safety | npm run lint | no TS errors | Pass |
| NFR-02 | Production build | npm run build | build succeeds | Pass |
| NFR-03 | Deployment route mapping | netlify.toml review + call tests | /api routes map to function | Pass |
| NFR-04 | Local/hosted parity | server.ts proxy design inspection | shared handler path | Pass |
| NFR-05 | User feedback clarity | error-path walkthrough | explicit backend/model messages | Pass |
| NFR-06 | Security of secrets | config and gitignore review | no secrets in source control | Pass with manual discipline |

#### G.3 Security and Abuse Risk Register

Risk 1: Role header spoofing  
Description: Admin access currently depends on role header supplied by frontend.  
Impact: Unauthorized access if endpoint is called manually with forged header.  
Mitigation (future): server-issued signed tokens and claim verification middleware.

Risk 2: Brute force login attempts  
Description: Login endpoint currently has no rate limiting or lockout.  
Impact: Credential stuffing risk.  
Mitigation (future): rate limiter, IP throttling, account lock policy.

Risk 3: Contact form spam flooding  
Description: Contact endpoint writes logs without anti-automation controls.  
Impact: audit noise and storage abuse.  
Mitigation (future): CAPTCHA, throttling, queue buffering.

Risk 4: External model dependency outage  
Description: HF endpoint controls core analysis availability.  
Impact: temporary analysis unavailability.  
Current mitigation: explicit error signaling and non-fabricated output policy.

Risk 5: Unbounded history growth  
Description: scans table may grow without retention policy.  
Impact: performance degradation and storage cost.  
Mitigation (future): retention windows, archival jobs, pagination enforcement.

Risk 6: Inference payload abuse  
Description: large text submission could stress model endpoint or API.  
Impact: latency and failure risk.  
Current mitigation: text truncation to bounded length.

#### G.4 Performance Discussion

For current academic scale, performance is adequate because:

- API logic is straightforward,
- DB queries are indexed on key fields,
- chart payloads are bounded by time windows and limits.

Potential future bottlenecks include analytics query expansion and large threat-log retrieval without pagination. Introducing server-side pagination and query caching would improve scalability for larger cohorts.

#### G.5 Acceptance Criteria for Final Submission

The following acceptance criteria can be used during final demo rehearsal:

1. Application boots locally with `npm run dev` and serves both UI and API.
2. Login succeeds for default admin and routes to admin pages.
3. Signup creates a new USER and user can analyze email.
4. User dashboard shows newly created scan history entries.
5. Admin users page lists users and allows non-admin deletion only.
6. Admin threat log shows phishing-only records.
7. Admin analytics renders totals and chart panels without runtime error.
8. Contact form submission returns success and inserts audit log.
9. If model endpoint is unavailable, UI displays "model is sleeping at HF." and does not synthesize fallback score.
10. Type check and production build complete successfully.

#### G.6 Suggested Viva Demonstration Sequence

Step 1: Show architecture overview and role map.  
Step 2: Log in as user and run manual analysis.  
Step 3: Show user-specific history update.  
Step 4: Log in as admin and review dashboard summary, threat logs, and analytics.  
Step 5: Create and delete a standard user account from admin panel.  
Step 6: Demonstrate explicit model outage behavior messaging.  
Step 7: Show SQL schema and discuss persistence model.  
Step 8: Show notebook sections for dataset merge and cross-corpus evaluation.  
Step 9: Summarize limitations and future enhancements.

### Appendix H: End-to-End Operational Narratives (Execution-Level Walkthrough)

This appendix provides narrative walk-throughs that connect architecture, source code, and runtime behavior from first user interaction to database persistence and dashboard rendering. It is designed for assessors who want to understand the software not only as static files, but as executed flows.

#### H.1 Standard User Journey Narrative

The standard user journey begins at frontend initialization. `src/main.tsx` mounts the React app and immediately loads route definitions from `src/App.tsx`. Because route protection is context-aware, the first meaningful state check happens inside `AuthContext`, where localStorage is inspected for previously stored user identity.

If the user is not authenticated, navigation through `Navbar` offers login and signup paths. The user selects signup, enters name/email/password, and submits the form in `SignUp.tsx`. The frontend sends payload to `/api/auth/signup` via `apiUrl` helper. On backend, route normalization maps request to `/auth/signup`, validation enforces required fields and password length, and role is explicitly set to USER. If successful, database insert occurs in `phish_users`, and frontend redirects to login.

At login, `Login.tsx` calls `/api/auth/login` with credentials. Backend selects user row by email and compares hash with bcrypt. On success, backend returns minimal identity fields: id, email, role. Frontend normalizes role to ADMIN/USER and writes user object into auth context and localStorage. This persistence allows browser refresh without immediate logout.

After login with USER role, route logic redirects to `/user`, where `UserDashboard.tsx` loads. On mount, it triggers `loadHistory()` and calls `/api/user/scans?userId=...&limit=20`. Backend validates `userId`, queries `phish_email_scans`, orders by timestamp descending, and returns mapped records. If the user is new, history renders an empty-state panel.

The user then performs analysis by filling subject, sender, and body text fields and pressing Analyze Email. Frontend posts to `/api/analyze` with `userId`, subject, sender, and text. Backend validates text non-emptiness and builds normalized full text string. `analyzeEmailAsync()` calls HF endpoint. If endpoint returns successful output, backend normalizes fields (`label`, `confidence`, `phishingProb`, `requestId`). Then `saveScan()` computes binary phishing flag using threshold from system settings and inserts a row in `phish_email_scans`.

Response payload is returned to frontend with id, label, confidence, risk score, binary class, and threshold. User dashboard renders result badge (phishing or legitimate) and then refreshes history list so the latest scan appears immediately. This creates a complete loop from input to persistence to personal timeline.

If inference endpoint is unavailable, backend throws and catch block returns error message. Frontend displays this error directly. Importantly, no synthetic result is shown. This means user perception remains aligned with system state, which is a critical trust property in security applications.

From a UX perspective, the user journey is intentionally linear and low-friction:

1. Register/login,
2. Submit content,
3. Read classification,
4. Review historical outcomes.

This sequence supports both casual experimentation and repeated usage for personal awareness.

#### H.2 Administrator Journey Narrative

The administrator journey begins similarly with login, but route resolution sends admin users to `/admin` and mounts `AdminLayout.tsx`. This layout enforces role checks before rendering child content and provides a persistent shell with navigation to Overview, Users, Threat Log, and Analytics.

Overview page (`admin/Dashboard.tsx`) issues periodic requests to `/api/dashboard/summary` and includes `x-user-role` header. Backend validates admin role before processing. Summary computation runs over a 24-hour window, generating top-line stats and chart bucket arrays. The frontend maps these into stat cards and chart components. Because data refreshes every 15 seconds, the dashboard approximates near-real-time monitoring behavior.

Users management page (`admin/UsersManagement.tsx`) loads `/api/admin/users`, where backend joins user list and scan counts (via aggregation map from `phish_email_scans.user_id`). Admin can create new user accounts with email and password. Backend enforces:

- role header is ADMIN,
- password length minimum,
- duplicate email prevention,
- explicit rejection of default admin email creation.

Delete flow calls `/api/admin/users/:id`. Backend ensures target exists and blocks deletion if role resolves to ADMIN. This prevents accidental lockout of primary administrative identity.

Threat log page (`admin/ThreatLog.tsx`) requests `/api/admin/threats?limit=200` and displays phishing-only rows with sender, subject, provider, probability, confidence, and detection timestamp. This page is essential for post-event review and dataset introspection.

Analytics page (`admin/Analytics.tsx`) requests `/api/admin/analytics`. Backend executes parallel aggregate queries:

- total user count,
- total scan count,
- total threat count,
- recent 14-day sender/timestamp dataset.

It then computes threat rate, per-day series, and top sender list before returning structured payload. Frontend renders line and bar charts via Recharts.

Operationally, admin journey demonstrates the project's strongest full-stack value: role-aware governance over data generation and interpretation. Instead of only exposing raw model output, the system provides curated oversight surfaces that transform events into actionable monitoring signals.

#### H.3 Local-to-Deployment Runtime Narrative

A major source of failure in student projects is environment mismatch. This project addresses that by designing local and hosted execution around one backend logic path.

In production-like deployment:

- Netlify hosts static frontend assets from `dist`.
- `netlify.toml` maps `/api/*` to `/.netlify/functions/api/:splat`.
- Function runtime executes `netlify/functions/api.ts`.

In local development:

- `npm run dev` launches `tsx server.ts`.
- Express parses request and forwards `/api` routes to imported `apiHandler` from the same function file.
- Vite middleware handles frontend assets and HMR.

This architecture means route logic, validation, and DB behavior are not re-implemented for local mode. All critical backend behavior is shared. As a result, defects observed locally have high predictive value for hosted behavior, and fixes apply to both contexts.

The deployment narrative also includes configuration semantics. Frontend `apiUrl` helper supports same-origin routing when API base URL is not set, but deployment best practice remains explicit `VITE_API_BASE_URL` for cross-host architectures. Backend CORS controls must include deployed frontend origin for request acceptance.

The health endpoint can be used as immediate smoke test after deployment. A robust release checklist therefore includes:

1. verify environment variables,
2. validate health route,
3. run login flow,
4. run analyze flow,
5. verify persistence in Supabase,
6. verify admin pages.

This narrative-level testing sequence is useful during demo rehearsals and viva defense because it demonstrates systems thinking beyond code syntax.

#### H.4 Refactor Chronology and Architectural Rationale

The repository history and local planning artifacts indicate multiple architectural stages. Early phases included broader integration ambitions and fallback continuity behavior. Later phases tightened scope to achieve robust completion under realistic timeline constraints.

Refactor themes include:

Theme 1: Role Simplification  
The project moved from broader role concepts to two concrete roles (ADMIN and USER). This simplifies route security, data ownership logic, and UI complexity.

Theme 2: API Consolidation  
Backend logic was consolidated into a central function handler. This supports easier reasoning and deployment alignment.

Theme 3: Integration Removal for Scope Integrity  
Gmail/Outlook integration UI and routes were removed from active runtime to align delivered features with stable implementation goals.

Theme 4: Failure Integrity  
Heuristic fallback scoring was removed from active analysis path. This ensures that displayed outputs are model-backed and trustworthy.

Theme 5: Deployment Reliability  
Local proxy approach was introduced so local execution mirrors production route handling.

From an examiner perspective, this chronology demonstrates mature engineering prioritization: choosing correctness, traceability, and maintainability over feature sprawl.

#### H.5 Architectural Lessons for Future Cohorts

This project yields transferable lessons for future final-year implementations:

1. Treat deployment as part of architecture from day one.
2. Keep one source of truth for backend logic across environments.
3. Prefer explicit failure messaging over hidden fallback behaviors in security apps.
4. Use SQL scripts for reproducible environment initialization.
5. Keep role model minimal unless complexity is required by objective.
6. Separate private report artifacts from submission-grade code.

These lessons are not abstract recommendations; they are grounded in concrete changes made across this codebase and reflected in measurable improvements to startup reliability, route behavior, and output trustworthiness.

#### H.6 Final Narrative Summary

When the system is observed as an execution pipeline, the technical coherence is clear:

- frontend routes and guards direct user intent,
- backend validates, computes, and persists,
- database stores evidence for retrospective analysis,
- admin interfaces convert records into governance insight,
- model outages are signaled honestly.

This end-to-end narrative is the strongest argument that the project qualifies as a complete software engineering deliverable, not just a machine-learning experiment.

#### H.7 Submission Readiness Reflection

From a submission-readiness perspective, the project now presents balanced evidence across research, implementation, verification, and critical reflection. The source code is structured enough for examiner walkthrough, the architecture is understandable at multiple abstraction levels, and the documentation set supports both technical scrutiny and report formatting workflow. Most importantly, the system's current behavior is aligned with truthful operational semantics: it reports what it can genuinely infer and clearly communicates when core dependencies are unavailable. This alignment between implementation behavior and report claims substantially improves credibility during demonstration and viva discussion.

### Appendix I: Project Proposal and Plan Archive (Template-Mapped)

This appendix block is intentionally aligned with the formal report template requirement for including both revised and original proposal and planning material. When preparing the final Word document, this content should be mapped to Appendix A headings if your template requires that exact label.

#### I.1 Revised Proposal and Final Project Aim

Revised project title:  
PhishBERT: Intelligent Phishing Email Detection with Context-Aware NLP and Role-Based Operational Analytics.

Final project aim:  
To design, implement, and critically evaluate an end-to-end phishing detection platform that combines transformer-based email analysis with secure role-based workflows, persistent data analytics, and deployment-consistent runtime behavior.

Revised research questions:

1. Can a transformer-informed phishing classifier be integrated into a reliable full-stack workflow rather than a notebook-only demonstration?
2. Can role-based workflows improve both usability and governance compared with a single-interface design?
3. Can explicit model-unavailability signaling provide stronger operational trust than heuristic continuity behavior?

Revised success criteria:

1. User and admin roles operate through protected routes with meaningful separation.
2. Analysis results persist with traceable fields that support history and analytics.
3. Local and hosted API behavior remain consistent through shared handler execution.
4. Failure conditions are communicated transparently without fabricated model output.
5. The project provides complete report, diagram, and appendix evidence for independent examiner verification.

#### I.2 Revised Project Plan

| Phase | Planned Activity | Actual Output | Outcome |
|---|---|---|---|
| Phase 1 | Problem framing and baseline architecture | Initial React and backend scaffolding | Completed |
| Phase 2 | Persistence and auth workflow implementation | Supabase schema, signup/login routes, context wiring | Completed |
| Phase 3 | Analysis workflow and model integration | /api/analyze route, user dashboard flow, history retrieval | Completed |
| Phase 4 | Admin governance and analytics | Dashboard, users management, threat logs, analytics charts | Completed |
| Phase 5 | Deployment alignment and stability | netlify.toml routing and server.ts parity adapter | Completed |
| Phase 6 | Documentation and evidence packaging | report.md, diagram set, appendix evidence, runbook | Completed |

Milestone variance notes:

1. Integration-heavy features from early plan were reduced to preserve implementation stability within deadline.
2. Documentation effort increased late in the timeline to ensure submission readiness and traceability quality.
3. Explicit failure semantics were introduced after evaluating integrity risks in fallback behavior.

#### I.3 Original Proposal Snapshot

The original proposal emphasized a broader mailbox-integration concept and a higher number of operational features, including integration with external email providers for near-real-time message ingestion. While technically attractive, this scope created elevated dependency and integration risk for a final-year delivery timeline.

Original objectives (summarized):

1. Build phishing detection engine using NLP-based classifier.
2. Integrate mailbox data collection from provider APIs.
3. Provide dashboard-driven analytics and threat visibility.
4. Support user and admin roles with separate capability boundaries.
5. Deliver complete technical report and demonstration artifacts.

Scope reality assessment:

The final implementation retained the strongest value-bearing objectives and deferred high-risk integrations. This was an intentional engineering decision to prioritize demonstrable quality, reproducibility, and evaluation validity.

#### I.4 Project Plan Reflection and Variance Analysis

Plan adherence reflection:

1. Core architecture, API, and database milestones were achieved on schedule.
2. Admin analytics and governance features required additional iteration due to query shaping and UI rendering complexity.
3. Documentation and diagram production consumed more time than initially estimated, which is common in software projects where implementation evolves significantly.

Reasons for variance:

1. Scope reduction was necessary to avoid unstable integrations that could undermine final submission quality.
2. External model dependency behavior required additional reliability-focused design decisions.
3. Report expansion to assessment-ready depth required substantial cross-checking against code and diagrams.

Lessons learned from planning:

1. Early identification of high-risk integrations improves delivery confidence.
2. A single shared backend handler across environments reduces both testing burden and defect ambiguity.
3. Technical documentation should be produced incrementally rather than concentrated at project end.

Revised plan effectiveness:

The revised plan was effective because it preserved project aim integrity while reducing risk and improving submission confidence. The final artifact demonstrates a complete engineering workflow: requirements, design, implementation, testing, evaluation, critical reflection, and reproducible operations.

### Appendix J: Reference Quality and Citation Usage Notes

This appendix records how reference sources were selected and used in the report.

Source selection criteria:

1. Preference for peer-reviewed journals, major conference proceedings, and standards publications.
2. Inclusion of security governance standards for legal and professional discussion.
3. Inclusion of platform documentation only where implementation-specific behavior needed citation.
4. Use of survey literature to contextualize domain breadth and justify methodological choices.

Citation usage pattern:

1. Chapters 1 to 3 use literature to justify problem significance and model/design selection.
2. Chapters 4 and 10 use standards and governance literature to support ethical and professional critique.
3. Implementation chapters use technical documentation references for framework/runtime correctness.

Harvard style consistency note:

All references are written in Harvard-style structure with author, year, title, source, and access details for online materials. In the final Word export, ensure punctuation and italics are normalized according to your department's Harvard guide.

---

## 14. Comprehensive Diagram Explanations and Traceability

This chapter provides explicit explanation of every major diagram artifact and ties each symbol, actor, process, data store, and message to concrete implementation in the workspace. The objective is to remove ambiguity during assessment and ensure the visual models are not generic textbook diagrams but executable-architecture representations.

### Diagram Inventory and Purpose

The final diagram inventory consists of five families:

1. Use case diagram (actor-intent system boundary model).
2. Sequence diagrams (stepwise interaction timing for each implemented use case).
3. ERD (database entities, attributes, keys, and relationships).
4. DFD hierarchy (Level 0, Level 1, and process-level Level 2 decompositions).
5. Architecture diagrams (component architecture and deployment architecture).

The use case and sequence diagrams answer: who does what, and in what order? The ERD answers: what is persisted? The DFD set answers: how information transforms as it moves through processes? The architecture views answer: where components run and how they connect.

### Use Case Diagram Explanation

The use case diagram is implementation-aligned and intentionally excludes removed runtime integrations. The system boundary labeled "PhishBERT System" includes all behavior currently available through route logic and UI pages.

External actors:

- Visitor: can sign up, log in, submit contact message, and run manual analysis without an authenticated session.
- Registered User: can log in, analyze email, and view own scan history.
- Admin: can access dashboard, user management, threat management, and analytics.
- HF Inference API: external model service used for prediction.
- Supabase PostgreSQL: persistence backplane used by all stateful use cases.

Core use cases:

- Sign Up.
- Log In (Role-Based Redirect).
- Submit Contact Message.
- Analyze Email Content.
- View Own Scan History.
- View Security Dashboard.
- Manage Users.
- Manage Threat Data.

The include relationships in the use case model reflect mandatory internal behavior. For example, Analyze Email includes both Call HF Model Endpoint and Persist/Query Scan Data. This is mandatory because a classification response is derived from model output and then stored for history and analytics continuity.

The extend relationships represent optional or scenario-specific admin actions. Manage Users is extended by List Users, Create User, and Delete User; Manage Threat Data is extended by View Threat Logs and View Analytics. This matches frontend navigation and route specialization, where admin pages are separate screens but conceptually part of broader governance operations.

### Sequence Diagram Set Explanation (UC-01 to UC-09)

Each sequence diagram maps to one use case and was split into standalone draw.io files for review convenience.

UC-01 Sign Up:

- Visitor submits registration details in frontend.
- Backend validates fields and checks duplicate email.
- Password is hashed with bcrypt and inserted into phish_users.
- Success response returns and frontend redirects to login.

UC-02 Log In:

- User submits credentials.
- Backend queries user by email and verifies bcrypt hash.
- Response returns id/email/role.
- AuthContext persists session to localStorage and redirects by role.

UC-03 Contact Message:

- Visitor submits name/email/message.
- Backend validates payload and inserts CONTACT_MESSAGE into phish_audit_logs.
- Success acknowledgment is returned.

UC-04 Analyze Email:

- User submits subject/sender/body.
- Backend normalizes text and calls Hugging Face endpoint.
- System reads threshold setting, computes binary classification/risk, persists scan row, returns payload.
- Frontend renders label/confidence/risk and refreshes history.

UC-05 User Scan History:

- User dashboard requests scans by userId.
- Backend filters phish_email_scans by owner and limit.
- Ordered rows are returned and rendered.

UC-06 Admin Dashboard:

- Admin opens overview.
- Backend computes totals and recent trend metrics.
- UI updates cards/charts on periodic polling.

UC-07 Manage Users:

- Admin lists users and scan counts.
- Optional create/delete operations performed through protected admin routes.
- API blocks protected admin deletion scenario.

UC-08 Threat Logs:

- Admin fetches phishing-classified scan entries.
- Backend applies filters, ordering, and bounded limit.
- UI shows log table for review.

UC-09 Analytics:

- Admin requests analytics bundle.
- Backend aggregates totals, threat rate, daily series, top senders.
- UI renders chart-ready structures.

### ERD Explanation and Rationale

The ERD is tied to supabase/schema_and_seed.sql and captures four principal tables.

Table: phish_users

- Stores identities used by app authentication.
- Key columns: id (uuid), full_name, email (unique), password_hash, role, created_at, updated_at.
- Purpose: role-based access and ownership linking.

Table: phish_email_scans

- Stores all analysis outcomes.
- Key columns: id, user_id (nullable for anonymous/demo analysis), sender, subject, snippet, model_label, confidence, phishing_prob, is_phishing, provider, detected_at, created_at.
- Purpose: persistence for user history, threat log, dashboard, analytics.

Table: phish_system_settings

- Stores runtime tuning values.
- Key columns: key, value_json, description, updated_at.
- Used currently for phishing_threshold, enabling policy changes without code edits.

Table: phish_audit_logs

- Stores auditable events (contact messages and potential admin actions).
- Key columns: id, actor_email, action, details_json, created_at.
- Purpose: traceability, minimal governance logging, and operational introspection.

Relationship summary:

- phish_users 1-to-many phish_email_scans via user_id.
- system settings read by analysis process to classify risk boundary.
- audit logs capture side-channel operational events.

Index and trigger notes:

- Indexes on frequently queried columns (email, user_id, detected_at, role) support dashboard/history performance.
- updated_at trigger on users helps maintain modification traceability.

### DFD Level 0 (Context) Explanation

Level 0 represents PhishBERT as one process (P0) connected to external entities. This is useful for non-technical audiences because it avoids implementation details while clarifying trust boundaries.

Inbound flows:

- Visitor/User sends authentication payloads, analysis text, and contact submissions.
- Admin sends governance requests.

Outbound flows:

- System returns authentication outcomes, analysis verdicts, user history, and admin metrics.

External service flows:

- P0 sends inference payload to HF API and receives model output.
- P0 reads/writes structured records through Supabase.

Level 0 key message: this is a data-driven decision support system with two external dependencies (model service + managed database).

### DFD Level 1 (Major Process Decomposition)

Level 1 decomposes P0 into five process groups:

- P1 Authentication and Access Control.
- P2 Email Analysis and Verdict Generation.
- P3 User Scan History Retrieval.
- P4 Admin Dashboard and Governance.
- P5 Contact Message Logging.

The process decomposition aligns exactly with grouped backend route families and UI feature sets. Data stores D1-D4 map directly to physical SQL tables.

Notable modeling decisions:

- P2 is separated from P3 because analysis writes while history is read-only.
- P4 is separated from P3 despite reading similar scan data because admin semantics differ from user ownership semantics.
- P5 writes only to audit logs and does not interfere with analytic scan pipeline.

### DFD Level 2 Explanations

#### 11.7.1 P1 Authentication Level 2

P1 decomposes into validation, uniqueness checking, password hashing, credential verification, and profile return steps. The decomposition captures the fact that signup and login share the same user store but use different transformation logic (create-hash versus compare-hash).

#### 11.7.2 P2 Analysis Level 2

P2 decomposition emphasizes semantic steps:

1. Input normalization.
2. Payload construction.
3. External inference request.
4. Prediction transformation.
5. Threshold/risk mapping.
6. Persistence.
7. Response return.

This view clarifies where correctness and reliability decisions occur. Inference happens externally, while classification policy and storage remain controlled by the backend.

#### 11.7.3 P3 User History Level 2

P3 decomposition shows ownership-scoped query logic, bounded retrieval, ordering, and response mapping. This prevents confusion with admin threat retrieval flows that use broader filters and different output semantics.

#### 11.7.4 P4 Admin Governance Level 2

P4 decomposition separates authorization, dashboard aggregation, user management, threat retrieval, and analytics construction. This decomposition is important for future security hardening because each subprocess can be assigned independent policy controls and rate limits.

#### 11.7.5 P5 Contact Logging Level 2

P5 decomposition tracks validation, audit payload construction, persistence, and confirmation. Although technically small, this process is modeled separately to preserve governance and anti-abuse traceability.

### Component Architecture Diagram Explanation

The component diagram captures code-structure dependencies:

- Client layer: React app, pages, AuthContext, and API helper.
- API layer: centralized Netlify function route dispatcher with auth, analysis, user-data, admin-data modules.
- External layer: Supabase, Hugging Face endpoint, and Netlify runtime.

The most important architectural point is handler unification: local Express development imports and executes the same API logic used by Netlify deployment. This reduces regression risk between local testing and hosted behavior.

### Deployment Architecture Diagram Explanation

The deployment view shows both cloud and local modes:

- Cloud mode: browser -> Netlify static + function -> Supabase/HF.
- Local mode: browser -> Vite + Express adapter -> same API logic -> Supabase/HF.

This dual-view deployment model is intentionally explicit because assessors often ask why local behavior differs from deployed behavior in student projects. Here, the architecture directly addresses that problem.

### Diagram Consistency Checklist

To ensure diagram correctness, each diagram was checked against source artifacts:

- Routes and method names matched netlify/functions/api.ts.
- UI role behaviors matched src/App.tsx and page components.
- Table structures matched supabase/schema_and_seed.sql.
- Deployment mapping matched netlify.toml and server.ts.

This consistency process is essential for viva credibility because diagram claims are verifiable against code, not speculative.

---

## 15. Exhaustive File-by-File Codebase Walkthrough

This chapter documents the role of each major file and directory in the delivered implementation. The goal is end-to-end traceability and to satisfy the requirement that no meaningful implemented functionality is skipped.

### Root-Level Runtime and Build Files

README.md:

- Primary setup and usage instructions.
- Includes architecture and run commands.
- Contains historical narrative traces that should be interpreted alongside current code.

package.json:

- Defines scripts for development, build, lint, and preview.
- Declares frontend and backend-support dependencies used in the TypeScript stack.

tsconfig.json:

- TypeScript compiler settings for the workspace.
- Supports strict typed development and compile-time safety.

vite.config.ts:

- Vite build/dev configuration.
- Integrates plugin and local dev behavior.

netlify.toml:

- Deployment mapping of static publish directory and function routing.
- Ensures /api/* path is routed to Netlify function handler.

server.ts:

- Local development adapter.
- Proxies /api requests to the same handler logic used in deployment.
- Serves Vite middleware for frontend development workflow.

index.html:

- Frontend HTML shell and mount point.

metadata.json:

- Project metadata record used for environment/context description.

memory.md:

- Workspace-level notes and context retention artifact.

### Backend API File (Critical Execution Core)

netlify/functions/api.ts is the operational center of the system. It contains:

- Shared CORS and response helpers.
- Route normalization and method dispatching.
- Environment and Supabase initialization logic.
- Authentication endpoints.
- Analysis endpoint and model integration.
- User endpoints.
- Admin endpoints.
- Contact and health endpoints.

Key backend characteristics:

1. Single-entry dispatch architecture: reduces fragmented route behavior.
2. Explicit status codes and JSON error contracts: improves frontend predictability.
3. Role checks for admin operations: enforces minimal governance boundary.
4. Controlled model-failure semantics: no fabricated fallback prediction in active path.
5. Structured mapping of DB rows to frontend-friendly response shape.

### Frontend Bootstrap and Routing

src/main.tsx:

- React DOM entry point.
- Wraps app in providers and mounts to root node.

src/App.tsx:

- Central route map.
- Contains protected route behavior for role-based pages.
- Defines visitor pages and authenticated user/admin sections.

src/index.css:

- Global styling foundation.
- Defines utility and visual baseline across pages.

### Frontend Shared Utilities and Context

src/lib/api.ts:

- Encapsulates API base URL generation and request helpers.
- Ensures frontend route calls are centralized and maintainable.

src/lib/utils.ts:

- Contains reusable small helper utilities used across components.

src/contexts/AuthContext.tsx:

- Stores authenticated user state (id/email/role).
- Exposes login/logout helper operations.
- Persists session to localStorage for refresh continuity.
- Acts as gatekeeper source for route-level role checks.

### Reusable Layout Components

src/components/Navbar.tsx:

- Navigation adaptation by session state.
- Shows role-appropriate entries and auth actions.

src/components/Footer.tsx:

- Shared footer layout element.

src/components/AdminLayout.tsx:

- Parent wrapper for all admin pages.
- Enforces role awareness and side navigation structure.

### Visitor and User-Facing Pages

src/pages/Home.tsx:

- Landing page and demo-level analysis interface.
- Sends manual analysis payloads.

src/pages/Login.tsx:

- Credential submission and role-based redirect logic.
- Integrates with AuthContext session persistence.

src/pages/SignUp.tsx:

- User registration form and validation feedback.
- Calls signup API endpoint and handles duplicate/validation errors.

src/pages/About.tsx:

- Informational content describing project and purpose.

src/pages/Contact.tsx:

- Contact form UI.
- Calls backend contact endpoint and handles success/failure states.

src/pages/user/UserDashboard.tsx:

- Primary authenticated user workspace.
- Combines manual analysis form with own scan history list.
- Refreshes history after successful analysis.

### Admin Pages and Governance Workflows

src/pages/admin/Dashboard.tsx:

- Overview metrics cards and trend visualizations.
- Periodic polling strategy for near-live updates.

src/pages/admin/UsersManagement.tsx:

- Displays user list and derived scan counts.
- Create-user and delete-user operations via admin endpoints.

src/pages/admin/ThreatLog.tsx:

- Table view of phishing-only events for oversight.

src/pages/admin/Analytics.tsx:

- Deeper aggregate visualizations and sender breakdowns.

Collectively, these pages deliver all currently implemented admin use cases declared in UML and DFD models.

### Database Schema and Seed

supabase/schema_and_seed.sql provides reproducible persistence setup:

- Drops and recreates required project tables.
- Defines constraints, defaults, and keys.
- Creates indexes for performance-critical query paths.
- Inserts baseline admin/user data and initial settings.

This file is crucial for examiner reproducibility because it removes dependency on ad hoc manual setup.

### Model and Research Artifacts

Model/best_model.pt:

- Trained model weights artifact retained locally.

Model/phishing-detection-training-v2.ipynb:

- Notebook documenting data preparation, model training/evaluation, and experimentation.

Model/tokenizer.json and tokenizer_config.json:

- Tokenizer artifacts used to align text processing with trained model expectations.

These files support research traceability and model reproducibility claims.

### Documentation and Diagram Artifacts

docs/diagrams and private_docs/diagrams contain current and legacy diagram assets.

Current-aligned diagrams include:

- Use case.
- ERD.
- Consolidated and split sequence diagrams.
- DFD Level 0/1/2 set.
- Component and deployment architecture diagrams.

Legacy diagram files are preserved for historical reference but clearly marked to avoid confusion.

### Private Documentation and Writing Support

private_docs contains report-writing and alignment materials:

- abstract and introduction drafts.
- objective completion mapping.
- methodology diagram.
- local prototype references.

private_docs/flask_prototype/app.py is not the active production backend but is useful as a historical prototype alignment artifact showing earlier fallback-oriented behavior.

### Non-Functional Infrastructure and QA Files

netlify/functions and server adapter structure:

- Supports environment parity.
- Eases local debugging.

TypeScript and lint settings:

- Support static correctness and maintainability.

Build tooling:

- Ensures deployable artifact generation.

The combined stack demonstrates full software engineering lifecycle support, not only model inference.

---

## 16. Complete API Contract and Behavioral Specification

This chapter consolidates runtime API behavior for implementation-level clarity.

### Global Response and Error Conventions

- JSON used for all responses.
- HTTP status codes communicate validation, authorization, and runtime failures.
- Error payloads provide concise human-readable message fields.

### Public and Visitor-Accessible Endpoints

GET /api/health

- Purpose: liveness check.
- Expected response: status indicator and timestamp.
- Usage: deployment smoke tests and monitoring.

POST /api/auth/signup

- Purpose: create standard USER account.
- Input: full_name (optional depending UI), email, password.
- Validation: required fields, minimum length constraints, duplicate email check.
- Security behavior: hashes password before persistence.
- Failure modes: duplicate email, invalid payload, DB errors.

POST /api/auth/login

- Purpose: authenticate user/admin.
- Input: email, password.
- Validation: required fields.
- Verification: bcrypt compare with stored hash.
- Success output: id, email, role.
- Failure modes: invalid credentials, missing user, DB errors.

POST /api/analyze

- Purpose: classify submitted email content.
- Input: subject, sender, text, optional userId context.
- Process:
	- normalize payload,
	- call model endpoint,
	- transform prediction,
	- read threshold settings,
	- persist scan,
	- return response object.
- Success output: classification label, confidence, phishing probability, risk-level related metadata, persisted row id/timestamp fields.
- Failure modes:
	- 400 on invalid empty text,
	- 500/503 style runtime errors on inference or persistence failures.

POST /api/contact

- Purpose: capture user contact message as audit event.
- Input: name, email, message.
- Success: confirmation and inserted audit record behavior.
- Failure: validation or DB write failure.

### User-Protected Endpoint

GET /api/user/scans

- Purpose: return current user scan history.
- Query params: userId, limit.
- Behavior: filters by user_id, sorts by detection timestamp descending, maps response.
- Security caveat: current ownership context comes from supplied identity data and should be strengthened with signed claims in future hardening.

### Admin-Protected Endpoints

Admin endpoints are role-guarded and intended for ADMIN session contexts.

GET /api/dashboard/summary

- Purpose: high-level monitoring metrics.
- Includes totals and time-window patterns for quick situational awareness.

GET /api/admin/users

- Purpose: list users with auxiliary derived statistics such as scan counts.

POST /api/admin/users

- Purpose: create user account from admin panel.
- Validation: duplicate checks, password length constraints, role restrictions.

DELETE /api/admin/users/:id

- Purpose: delete selected non-admin account.
- Guard: admin account deletion blocked.

GET /api/admin/threats

- Purpose: return phishing-only scan rows for incident review.
- Query support: bounded limit for response control.

GET /api/admin/analytics

- Purpose: return aggregate metrics for dashboard charts.
- Includes totals, rates, recent-series and top-sender style summaries.

### Security and Correctness Observations

Strengths:

- Backend-side hashing and verification.
- Role checks for admin resources.
- Explicit model dependency error signaling.
- Structured and reusable response handling.

Current hardening gaps (future work candidates):

- Signed access token verification.
- Rate limiting and brute-force controls.
- Fine-grained audit capture for destructive admin actions.
- Request-body schema validation middleware.

### API Testing Strategy (Recommended)

A robust test strategy should include:

1. Unit tests for helper and transformation functions.
2. Integration tests for endpoint-route combinations.
3. Role-authorization tests for all admin routes.
4. Contract tests for response schema stability.
5. Failure-path tests for model downtime and DB unavailability.

This strategy can be implemented with lightweight test runners and mocked external dependencies.

---

## 17. Missing Diagram Identification and Added Deliverables

During full codebase audit, two major documentation gaps were identified beyond the already improved use case/ERD/sequence set:

Gap 1: No complete DFD hierarchy.

- Resolution: added DFD Level 0, Level 1, and five Level 2 decompositions.
- Benefit: explains information transformation and process/data-store boundaries in assessment-friendly format.

Gap 2: No explicit architecture views.

- Resolution: added component architecture and deployment architecture diagrams.
- Benefit: shows module dependencies and local-vs-cloud runtime behavior clearly.

Created files:

- dfd-level-0-context.drawio
- dfd-level-1-system.drawio
- dfd-level-2-auth.drawio
- dfd-level-2-analysis.drawio
- dfd-level-2-user-history.drawio
- dfd-level-2-admin-analytics.drawio
- dfd-level-2-contact.drawio
- component-architecture.drawio
- deployment-architecture.drawio

All new files were created in docs/diagrams and mirrored to private_docs/diagrams for consistency with the repository's dual documentation structure.

### Why These Additions Matter for Academic Assessment

Assessors typically evaluate three dimensions:

1. Correctness of implementation.
2. Communication quality of technical design.
3. Traceability between claims and evidence.

The added DFD and architecture diagrams directly improve dimensions 2 and 3. They convert route-level implementation details into layered visual language suitable for report chapters, viva explanation, and assessment rubric mapping.

### Integration with Existing Diagram Set

The enhanced documentation can now be read progressively:

1. Use case for actor goals.
2. Sequence diagrams for interaction timing.
3. DFD hierarchy for data transformation.
4. ERD for persistence semantics.
5. Component and deployment views for runtime architecture.

This progression is pedagogically stronger than a single-diagram strategy because each diagram family answers a different question and reduces cognitive overload.

---

## 18. Complete Enhancement Backlog (No Functionality Class Omitted)

The user requirement explicitly asks not to skip potential functionality. This chapter therefore enumerates a comprehensive backlog across security, ML, UX, operations, governance, and research tracks. The list is intentionally broad so future iterations can prioritize by feasibility and impact.

### Authentication and Access Hardening

1. Replace header-based role trust with signed JWT or Supabase Auth claims.
2. Add refresh-token flow with secure cookie strategy.
3. Add password complexity policy and breach-password detection.
4. Add brute-force defense (rate limit, lockout, exponential backoff).
5. Add email verification workflow.
6. Add forgot-password and reset token flow.
7. Add session revocation and single-session policy options.
8. Add admin multi-factor authentication.
9. Add audit trail for login success/failure attempts.
10. Add geo/IP anomaly detection flags for admin login.

### Analysis Pipeline Enhancements

1. Add asynchronous queue mode for long texts.
2. Add optional chunked inference for oversized payloads.
3. Add confidence calibration layer and reliability diagrams.
4. Add secondary ensemble model for disagreement alerts.
5. Add feature importance or explanation snippets for user-facing interpretability.
6. Add URL extraction + reputation scoring integration.
7. Add sender-domain SPF/DKIM/DMARC context enrichment.
8. Add attachment metadata screening.
9. Add language detection and multilingual model switching.
10. Add uncertainty thresholds that return "needs review" class.

### Data and Persistence Enhancements

1. Add soft-delete strategy and recovery window for users.
2. Add data retention policies for scan history.
3. Add archival tables for long-term historical analytics.
4. Add partitioning strategy for large scan datasets.
5. Add materialized views for dashboard-heavy aggregates.
6. Add advanced indexing for sender-domain and label-frequency queries.
7. Add row-level security policies in Supabase.
8. Add data encryption key rotation strategy for sensitive fields.
9. Add anonymization for research exports.
10. Add migration scripts with versioned schema history.

### Admin and Governance Enhancements

1. Add role granularity (SUPER_ADMIN, ANALYST, AUDITOR).
2. Add approval workflow before user deletion.
3. Add configurable admin action confirmation gates.
4. Add immutable audit signatures for high-trust logs.
5. Add case management for suspicious campaigns.
6. Add tagging and triage states for threat records.
7. Add export-to-CSV and PDF incident reports.
8. Add customizable dashboard widgets.
9. Add anomaly alerts and threshold notifications.
10. Add admin activity heatmap and accountability panels.

### User Experience Enhancements

1. Add guided onboarding for first-time users.
2. Add inline explanation cards for confidence and risk score.
3. Add bulk email sample import (CSV/text).
4. Add favorites/bookmarking for notable scans.
5. Add user-level trend charts and personal risk profile.
6. Add accessibility upgrades (ARIA audit, keyboard flow, contrast checks).
7. Add localization and multilingual UI packs.
8. Add mobile-first optimizations for dashboard pages.
9. Add notification center for scan completion and admin notices.
10. Add dark/light/custom theme personalization.

### MLOps and Model Lifecycle Enhancements

1. Add versioned model registry and endpoint routing by model version.
2. Add canary release strategy for new model versions.
3. Add drift monitoring dashboards (input/data/label drift).
4. Add periodic retraining workflows with reproducible pipelines.
5. Add benchmark suite for cross-corpus generalization checks.
6. Add bias and fairness evaluation metrics.
7. Add threshold optimization dashboard by cost profile.
8. Add model rollback automation.
9. Add offline evaluation package for exam reproduction.
10. Add automated model card generation for each version.

### DevSecOps and Reliability Enhancements

1. Add CI pipeline stages for lint, type-check, tests, security scan.
2. Add infrastructure-as-code templates for reproducible deployment.
3. Add secret scanning and policy enforcement in CI.
4. Add central error monitoring and alert channels.
5. Add structured logging with correlation IDs.
6. Add synthetic monitoring for health and analyze endpoints.
7. Add load testing scenario scripts.
8. Add backup/restore runbook and disaster recovery drills.
9. Add blue-green deployment option.
10. Add SLA/SLO definitions and error-budget governance.

### API and Integration Enhancements

1. Add OpenAPI/Swagger contract generation.
2. Add API versioning strategy.
3. Add webhook output for high-risk detections.
4. Add integration adapters for SIEM tools.
5. Add message queue event emission for downstream systems.
6. Add inbound email provider adapters (Gmail/Outlook/IMAP) as optional modules.
7. Add batch analysis endpoint.
8. Add async job status endpoints.
9. Add RBAC claim-based middleware shared across routes.
10. Add signed request validation for third-party integrations.

### Governance, Ethics, and Compliance Enhancements

1. Add explicit data-processing consent flow.
2. Add configurable retention policy UI for administrators.
3. Add compliance export packs (GDPR-style subject access support).
4. Add explainability report per detection event.
5. Add reviewer override and adjudication records.
6. Add false-positive dispute workflow.
7. Add content-redaction pipeline for sensitive material.
8. Add ethics checklist gate before production activation.
9. Add user education prompts for safe response behavior.
10. Add transparency report dashboard for model uptime and accuracy trends.

### Educational and Research Extensions

1. Add controlled experiment mode comparing baseline and transformer outputs.
2. Add dataset annotation interface for supervised corrections.
3. Add adversarial prompt bank for robustness testing.
4. Add phishing campaign simulation mode for training sessions.
5. Add classroom analytics view with anonymized aggregates.
6. Add repeatable experiment manifests.
7. Add notebook-to-dashboard metric synchronization.
8. Add result reproducibility badges for report evidence.
9. Add confidence interval display on evaluation metrics.
10. Add thesis appendix auto-generation pipeline from runtime stats.

### Prioritized Roadmap Proposal

Given finite development capacity, a pragmatic phased roadmap is recommended.

Phase A (Security foundation):

- signed auth claims,
- rate limiting,
- RLS policies,
- audit hardening.

Phase B (Reliability and ops):

- monitoring,
- structured logs,
- CI quality gates,
- backup strategy.

Phase C (ML maturity):

- model versioning,
- drift monitoring,
- calibration,
- explainability upgrades.

Phase D (integration expansion):

- mailbox connectors,
- webhooks,
- SIEM adapters,
- incident workflows.

Phase E (research and education):

- experimental dashboards,
- annotation tools,
- reproducibility automation.

This roadmap balances immediate risk reduction with long-term capability growth.

---

## 19. Critical Reflection on Implementation Quality

### Strengths

1. End-to-end completeness: the project is not isolated model code; it is a full product workflow.
2. Architectural clarity: local and deployed parity is explicitly designed.
3. Role-focused UX: admin and user journeys are distinct and coherent.
4. Data traceability: scan persistence supports analytics and auditing.
5. Honest failure semantics: model downtime is surfaced transparently.

### Limitations

1. Security model can be hardened significantly with signed claims and middleware.
2. External model dependency remains single point of operational failure.
3. Test automation depth can be expanded for stronger regression confidence.
4. Scale strategies (pagination, caching, partitioning) are partially present but not complete.
5. Explainability depth remains probability-level rather than token- or rationale-level.

### Engineering Trade-offs

The implementation favors architectural consistency and demonstrable correctness over maximal feature breadth. This is an appropriate trade-off for an FYP context where stable end-to-end execution is often more valuable than numerous unstable integrations.

### Academic Value

The project demonstrates multiple competence dimensions expected in final-year assessment:

- applied ML integration,
- full-stack software engineering,
- data modeling,
- deployment reasoning,
- critical evaluation,
- documentation maturity.

---

## 20. Final Conclusion

PhishBERT, in its current delivered form, is a coherent, implementation-grounded phishing email detection platform that connects contextual NLP inference with practical software architecture. The system supports complete user and administrator workflows, stores decision evidence for audit and analytics, and maintains explicit operational integrity through transparent failure handling.

The report now includes:

1. Full architectural and implementation narrative.
2. Detailed explanation of UML, ERD, DFD (all levels), and architecture diagrams.
3. File-by-file codebase mapping.
4. Endpoint-level behavioral specification.
5. Identification and resolution of previously missing diagram families.
6. Broad and actionable enhancement backlog for future work.

As a final-year project, the system demonstrates that meaningful cybersecurity tooling can be built through disciplined scope management, architecture-first thinking, and strong traceability between design artifacts and executable code.

---

## 21. Viva Defense and Evidence Mapping Pack

This chapter is designed as a direct viva support section. It anticipates common examiner questions and maps each question to concrete evidence sources in code, schema, and diagrams. The purpose is to ensure the oral defense is consistent, confident, and anchored in verifiable implementation details.

### Common Viva Questions and Suggested Evidence-Backed Answers

Question 1: Why did you choose a serverless function architecture instead of a traditional always-on backend server?

Evidence-backed answer:

- The project uses Netlify functions because the hosting model naturally supports static frontend deployment plus dynamic API routes.
- The same route logic is reused in local development through an Express adapter, reducing environment divergence.
- For an FYP scope, this architecture provides operational simplicity and cost efficiency.

Question 2: How do you ensure role-based access control is enforced?

Evidence-backed answer:

- Frontend route guards separate user and admin pages.
- Backend route checks are applied on admin endpoints before query execution.
- Admin-only operations include dashboard, user management, threat logs, and analytics routes.
- Current limitation: claims should be cryptographically signed in future hardening.

Question 3: How do you justify trust in predictions if the model is externally hosted?

Evidence-backed answer:

- The system explicitly separates inference acquisition from post-processing.
- If model endpoint is unavailable, backend returns a direct availability error and does not fabricate output.
- This policy preserves integrity and avoids misleading users.

Question 4: How are decisions persisted for auditability?

Evidence-backed answer:

- Every successful analysis inserts structured row data into phish_email_scans.
- Additional actions such as contact submissions are logged in phish_audit_logs.
- Admin dashboards and user history are built from persisted records rather than transient state.

Question 5: Why is the DFD hierarchy necessary when sequence diagrams already exist?

Evidence-backed answer:

- Sequence diagrams explain timing interaction.
- DFD hierarchy explains data transformation and process-store boundaries.
- Together they provide complementary perspectives required for complete system documentation.

Question 6: What is the strongest engineering decision in this project?

Evidence-backed answer:

- Unifying local and deployed backend behavior through a shared handler.
- This decision improves reproducibility, shortens debugging cycles, and strengthens confidence in pre-deployment testing.

Question 7: What are your most critical known risks?

Evidence-backed answer:

- Auth hardening currently needs signed token verification.
- External inference dependency can become unavailable.
- Brute-force and spam protections should be extended.
- These risks are transparently documented with mitigation roadmap in Chapter 15.

Question 8: Why did you keep historical artifacts such as legacy diagrams and prototype code?

Evidence-backed answer:

- They preserve design evolution evidence.
- They help explain refactor rationale in the report.
- They are clearly marked as legacy and not treated as current runtime behavior.

### Evidence Matrix for Demonstration

The following evidence matrix can be used during live walkthrough:

1. Use case coverage evidence:
	- use-case.drawio and route/page mapping chapter.
2. Sequence-level behavior evidence:
	- split sequence files for UC-01 to UC-09.
3. Data model evidence:
	- ERD and schema SQL definitions.
4. Runtime endpoint evidence:
	- api.ts route handlers and endpoint chapter.
5. Access control evidence:
	- App route guards and backend admin checks.
6. Deployment evidence:
	- netlify.toml route mapping and server.ts local adapter.
7. Reliability evidence:
	- explicit model unavailability messaging path.
8. Governance evidence:
	- audit log writes and admin views.

### Suggested Live Demonstration Script (Detailed)

Step 1: Architecture framing (2-3 minutes)

- Open component and deployment diagrams.
- Explain frontend/API/external dependency split.
- Highlight local and deployed parity pattern.

Step 2: Role demonstration (3-4 minutes)

- Show signup and login flows.
- Demonstrate user role redirect to user dashboard.
- Demonstrate admin login redirect to admin area.

Step 3: Core analysis loop (4-5 minutes)

- Submit realistic suspicious email text.
- Show response payload with classification and confidence.
- Immediately show history refresh to prove persistence.

Step 4: Admin monitoring loop (4-5 minutes)

- Open dashboard summary.
- Open threat logs.
- Open analytics charts.
- Explain how all views are generated from persisted scan rows.

Step 5: Governance operation (3 minutes)

- Create a standard user from admin interface.
- Attempt deletion scenarios and explain safeguards.

Step 6: Error handling integrity (2 minutes)

- Explain and, if possible, simulate model endpoint failure path.
- Show explicit error behavior rather than synthetic prediction.

Step 7: Data model closure (2-3 minutes)

- Open ERD and SQL schema.
- Connect tables with observed UI/API behavior.

### Assessor-Oriented Traceability Narrative

For many examiners, the key question is not whether each isolated component works, but whether the implementation is traceable from requirement to artifact to runtime effect. This project supports that traceability through a simple chain:

Requirement -> Use Case -> Sequence -> Route/Page -> SQL Persistence -> Dashboard/History Visualization.

Example chain for manual analysis:

- Requirement: classify submitted email and retain result.
- Use case: Analyze Email Content.
- Sequence: UC-04.
- Route/page: POST /api/analyze and Home/UserDashboard forms.
- SQL: insert into phish_email_scans.
- Visualization: user history table and admin threat/analytics.

This chain can be narrated quickly in viva and demonstrates mature systems thinking.

### Academic Reflection Prompts and Prepared Responses

Prompt: "If you had two more months, what would you improve first and why?"

Prepared response:

- First, security hardening with signed claims and rate limiting because this reduces immediate risk.
- Second, model lifecycle governance (versioning/drift) to improve long-term reliability.
- Third, explainability enhancements to improve analyst trust and educational value.

Prompt: "What did you remove, and was that a regression?"

Prepared response:

- Integration-heavy mailbox features were removed from active runtime for scope integrity.
- This was a deliberate quality-driven reduction, not a hidden regression.
- The resulting system is more stable, more traceable, and easier to assess reproducibly.

Prompt: "How do you prove your diagrams are not decorative?"

Prepared response:

- Each diagram symbol is mapped to code modules, routes, and SQL objects in report chapters.
- Sequence and DFD models include exact process boundaries and route semantics.
- Added architecture diagrams directly reflect deployment and component structure.

### Viva Readiness Checklist

Before final demonstration:

1. Run local application and verify basic health route.
2. Confirm seeded admin account works.
3. Run at least one user analysis and confirm history insert.
4. Confirm admin dashboard/threat/analytics pages render.
5. Keep ERD, DFD, and component diagrams open for quick reference.
6. Keep enhancement roadmap chapter ready for future-work question.
7. Prepare concise explanation of security limitations and mitigation plan.
8. Verify environment variables are correctly configured.

This checklist reduces live-demo uncertainty and supports confident oral defense.

---

## 22. Operational Runbook for Marker Reproduction

This chapter provides a marker-friendly runbook so assessors can reproduce core behavior quickly.

### Pre-Run Requirements

1. Node.js and npm installed.
2. Required environment variables configured for Supabase and model endpoint.
3. Database initialized with provided SQL script.

### Local Startup Procedure

1. Install dependencies with npm install.
2. Start local development stack with npm run dev.
3. Open local URL in browser.
4. Verify API liveness using /api/health.

### Verification Sequence

1. Register a test user.
2. Log in as that user and run manual analysis.
3. Confirm result appears in user history.
4. Log in as admin and verify dashboard summary.
5. Open threat log and analytics pages.
6. Create and optionally remove non-admin test account.

### Failure-Mode Verification

1. Temporarily misconfigure or isolate model endpoint.
2. Execute analysis request.
3. Confirm explicit model-unavailable message appears.
4. Confirm system does not generate synthetic fallback verdict.

### Reproduction Notes for Consistency

- Use the same seeded data when comparing screenshots or metrics.
- Keep request payloads consistent for comparable outputs.
- Note that confidence values depend on external model behavior and can vary.

### Marker Quick-Pass Criteria

The marker can conclude successful reproduction if:

1. Application launches without runtime crash.
2. Auth workflows complete for both user and admin roles.
3. Analysis endpoint returns structured classification payload.
4. Persistence is visible in history and admin pages.
5. Diagram explanations in report align with observed runtime behavior.

This runbook ensures the project can be independently validated within constrained assessment time.

---

---

---

## 23. Template Compliance and Writing Guide for Final Word Submission

This section explains how this markdown report maps directly to the official FYP Word template. It is intentionally explicit so the report can be transferred chapter by chapter without losing required content.

### 23.1 Compliance Status Against Required Top-Level Structure

Required template items and coverage status:

1. Title page: Covered in front matter at the top of this report (student details, module, supervisor, date, and word count line).
2. Declaration of AI Use: Covered in the dedicated `Declaration of AI Use` section.
3. Abstract: Covered in `Abstract` section (single-page length target satisfied).
4. Table of contents: Included as a placeholder and intended to be auto-generated in Word.
5. List of figures and list of tables: Included as placeholders and intended to be auto-generated in Word.
6. Chapter 1 Introduction: Covered in Chapter 1.
7. Chapter 2 Literature Review: Covered in Chapter 2.
8. Chapter 3 Product Review (if applicable): Covered in Chapter 3.
9. Chapter 4 Requirements Analysis and Design: Covered by combining Chapter 6 (requirements) and Chapter 7 (design).
10. Chapter 5 Implementation: Covered in Chapter 8.
11. Chapter 6 Results and Evaluation: Covered by Chapter 9 (testing and evaluation) and Chapter 10 (critical appraisal).
12. Chapter 7 Legal, Social, Ethical and Professional Issues: Covered in Chapter 4.
13. Chapter 8 Conclusion: Covered in Chapter 11 and reinforced in Chapter 20.
14. References: Covered in Chapter 12 with Harvard-style entries.
15. Appendix A Project Proposal and further appendices: Covered in Chapter 13 and extended appendices.

### 23.2 How to Transfer Content into the Template Chapter Order

If your department enforces strict chapter numbering in the final Word file, apply this transfer order:

1. Keep the existing front matter in the same sequence.
2. Use current Chapter 1 as template Chapter 1.
3. Use current Chapter 2 as template Chapter 2.
4. Use current Chapter 3 as template Chapter 3 (optional product review).
5. Merge current Chapters 6 and 7 into template Chapter 4 (`Requirements Analysis and Design`).
6. Use current Chapter 8 as template Chapter 5 (`Implementation`).
7. Merge current Chapters 9 and 10 into template Chapter 6 (`Results and Evaluation`).
8. Use current Chapter 4 as template Chapter 7 (`Legal, Social, Ethical and Professional Issues`).
9. Use current Chapters 11 and 20 together as template Chapter 8 (`Conclusion`).
10. Keep current Chapter 12 as references and Chapter 13 onward as appendices and supporting material.

This transfer plan preserves all technical evidence while matching the formal template structure exactly.

### 23.3 Required Questions and Whether They Are Answered

The template requires explicit answers to the core assessment questions. This report answers them as follows:

- What problem was addressed and why it matters: Chapter 1.
- What prior work exists and what gap remains: Chapters 2 and 3.
- What requirements were selected and why: Chapter 6.
- What was designed and why those design choices were made: Chapter 7.
- What was implemented and how it works in code and architecture: Chapters 8 and 15 to 16.
- How the prototype was tested and what evidence supports functionality: Chapter 9 and Appendix G.
- How outcomes were evaluated critically against objectives: Chapters 9, 10, and 19.
- What legal, social, ethical, and professional implications apply: Chapter 4.
- What was achieved, what was limited, and what remains for future work: Chapters 11, 18, and 20.

### 23.4 Word Count Guidance

This report is intentionally extensive and may exceed strict programme limits if transferred in full. If your supervisor requires a tighter cap, apply this reduction strategy while keeping evidence quality:

1. Keep Chapters 1 to 12 as the main body.
2. Move Chapters 14 to 22 into appendices or supplementary submission materials.
3. Retain Chapter 15 and Chapter 16 excerpts only where directly referenced by the implementation chapter.

### 23.5 Final Quality Assurance Rules Before Submission

1. Ensure every chapter opens with an introductory paragraph and ends with a short conclusion paragraph.
2. Ensure every non-trivial claim is backed by either implementation evidence, testing evidence, or literature references.
3. Ensure all figure captions are consistently formatted and cited in the text before the figure appears.
4. Ensure appendix references are called out explicitly from the main chapters.
5. Ensure references are alphabetically ordered and Harvard formatted.

## 24. Figure Placement Plan and Table of Figures Content

Use the following figure entries in your Word document. Insert each figure at the indicated chapter location and use the exact caption style for automatic list-of-figures generation.

### 24.1 Core Architecture and Analysis Figures

1. Figure 4.1: Use Case Diagram for Visitor, User, and Admin Workflows (`private_docs/diagrams/use-case.drawio`) - place in Requirements and Design chapter under system scope.
2. Figure 4.2: DFD Level 0 Context Diagram (`docs/diagrams/dfd-level-0-context.drawio`) - place in Design subsection after functional boundary discussion.
3. Figure 4.3: DFD Level 1 System Decomposition (`docs/diagrams/dfd-level-1-system.drawio`) - place after Figure 4.2.
4. Figure 4.4: DFD Level 2 Authentication Process (`docs/diagrams/dfd-level-2-auth.drawio`) - place in security/auth design subsection.
5. Figure 4.5: DFD Level 2 Analysis Process (`docs/diagrams/dfd-level-2-analysis.drawio`) - place in analysis pipeline design subsection.
6. Figure 4.6: DFD Level 2 User History Process (`docs/diagrams/dfd-level-2-user-history.drawio`) - place in persistence/history design subsection.
7. Figure 4.7: DFD Level 2 Contact Process (`docs/diagrams/dfd-level-2-contact.drawio`) - place in support workflow design subsection.
8. Figure 4.8: DFD Level 2 Admin Analytics Process (`docs/diagrams/dfd-level-2-admin-analytics.drawio`) - place in admin governance subsection.
9. Figure 4.9: Component Architecture Diagram (`docs/diagrams/component-architecture.drawio`) - place near end of design chapter.
10. Figure 4.10: Deployment Architecture Diagram (`docs/diagrams/deployment-architecture.drawio`) - place directly after component architecture.
11. Figure 4.11: Entity Relationship Diagram (ERD) (`private_docs/diagrams/erd.drawio`) - place in database design subsection.

### 24.2 Sequence and Runtime Behavior Figures

12. Figure 5.1: Sequence UC-01 Sign Up (`docs/diagrams/seq-uc-01-sign-up.drawio`) - place in implementation auth workflow subsection.
13. Figure 5.2: Sequence UC-02 Log In (`docs/diagrams/seq-uc-02-log-in.drawio`) - place after sign-up narrative.
14. Figure 5.3: Sequence UC-03 Contact Message (`docs/diagrams/seq-uc-03-contact-message.drawio`) - place in communication flow subsection.
15. Figure 5.4: Sequence UC-04 Analyze Email (`docs/diagrams/seq-uc-04-analyze-email.drawio`) - place in analysis implementation subsection.
16. Figure 5.5: Sequence UC-05 User Scan History (`docs/diagrams/seq-uc-05-user-scan-history.drawio`) - place in history retrieval subsection.
17. Figure 5.6: Sequence UC-06 Admin Dashboard (`docs/diagrams/seq-uc-06-admin-dashboard.drawio`) - place in admin implementation subsection.
18. Figure 5.7: Sequence UC-07 Manage Users (`docs/diagrams/seq-uc-07-manage-users.drawio`) - place in admin governance subsection.
19. Figure 5.8: Sequence UC-08 Threat Logs (`docs/diagrams/seq-uc-08-threat-logs.drawio`) - place in threat monitoring subsection.
20. Figure 5.9: Sequence UC-09 Analytics (`docs/diagrams/seq-uc-09-analytics.drawio`) - place in analytics subsection.

### 24.3 Optional Legacy and Extended Sequence Figures

21. Figure A.1: Sequence Connect Gmail (`docs/diagrams/seq-connect-gmail.drawio`) - place in appendix as legacy integration reference.
22. Figure A.2: Sequence Dashboard Threat Feed (`docs/diagrams/seq-dashboard-threat-feed.drawio`) - place in appendix as exploratory workflow.
23. Figure A.3: Sequence Manual Email Analysis (`docs/diagrams/seq-manual-email-analysis.drawio`) - place in appendix if not included in Chapter 5.
24. Figure A.4: Sequence Realtime Inbox Scan (`docs/diagrams/seq-realtime-inbox-scan.drawio`) - place in appendix as future extension narrative.

## 25. Final Submission Checklist

Use this checklist in the final week before submission:

1. Confirm chapter numbering in Word follows the official template.
2. Confirm abstract is between 250 and 500 words and fits on one page.
3. Confirm AI declaration reflects actual usage truthfully.
4. Confirm all figures are inserted with captions and referenced in text.
5. Confirm list of figures and list of tables are auto-generated and accurate.
6. Confirm references are complete, alphabetic, and Harvard formatted.
7. Confirm Appendix A includes final and original proposal and plan.
8. Confirm testing appendix includes evidence tables and test outcomes.
9. Confirm word count statement is updated from final Word file statistics.
10. Confirm there is no unresolved placeholder text before export to PDF.

## Quick Formatting Instructions for Word Submission

1. Use Heading 1 for chapter titles and Heading 2/3 for subsection structure.
2. Insert captions under each figure and table with consistent style.
3. Generate automatic Table of Contents, List of Figures, and List of Tables in Word.
4. Replace all bracketed metadata placeholders before submission.
5. Convert final report to PDF only after full proofreading and consistency checks.


