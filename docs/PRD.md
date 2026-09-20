# Cloudcraft Collective — Product Requirements Document

## 1. Product summary

Cloudcraft Collective is a publishing and collaboration platform for cloud architecture. It combines long-form technical writing with an editable architecture canvas and a Git-inspired contribution workflow. A published post is not a static diagram: readers can inspect the design, discuss decisions, fork it, improve it, and propose those improvements back to the author.

The product’s central unit is an **architecture post**: a versioned document containing a title, problem statement, solution narrative, interactive diagram, provider metadata, discussion, and contribution history.

## 2. Vision and goals

### Vision

Make real-world cloud architecture knowledge inspectable, reusable, and collectively improvable.

### Product goals

1. Help practitioners explain the context and trade-offs behind an architecture, not only show its final topology.
2. Make cloud diagrams easy to create and edit without requiring a specialist diagramming tool.
3. Turn passive reading into constructive collaboration through comments, forks, and change proposals.
4. Preserve architectural reasoning over time through versions, diffs, and review history.
5. Build a searchable body of practical, provider-aware architecture knowledge.

### MVP success signals

- At least 40% of new users create or fork an architecture during their first week.
- At least 25% of published posts receive one meaningful interaction: comment, fork, or contribution.
- At least 20% of forks result in a submitted pull request.
- Median time from blank canvas to first saved architecture is under 10 minutes.
- At least 70% of authors who receive a pull request review it within seven days.

### Non-goals for the MVP

- Full infrastructure-as-code generation or deployment.
- Real-time multiplayer editing with conflict-free merge semantics.
- Automated cost estimates guaranteed to match provider billing.
- Complete coverage of every cloud service and icon.
- Enterprise governance, private networking, or compliance certification.

## 3. Target users

### Cloud architect / platform engineer

Publishes reference architectures, documents platform decisions, and reviews contributions. Needs provider-specific components, clear boundaries, version history, and credibility signals.

### Application engineer

Explores proven patterns, forks an architecture, and adapts it to a workload. Needs understandable narratives, fast editing, and an easy way to ask questions or propose improvements.

### Consultant / educator / technical writer

Creates polished explainers and reusable patterns for clients or learners. Needs strong publishing tools, attractive embeds, attribution, and easy sharing.

### Engineering leader / reviewer

Reviews design intent, risk, and evolution without editing every node. Needs change summaries, discussions, decisions, and concise architecture-health signals.

## 4. Jobs to be done

- When I solve a difficult cloud design problem, help me publish the context, diagram, and trade-offs together so others can learn from the complete decision.
- When I find a useful architecture, help me copy and adapt it without damaging the source or losing attribution.
- When I see an improvement, help me propose the exact changes and explain why they matter.
- When I own an architecture, help me compare, discuss, accept, or reject proposed changes with confidence.
- When an architecture evolves, help me understand what changed, who changed it, and why.

## 5. Product principles

1. **Context beside topology:** prose and diagram are peers in the experience.
2. **Editable by default:** published diagrams remain inspectable and forkable when the author permits it.
3. **Safe collaboration:** contributors work on copies; authors control changes to the canonical version.
4. **Provider-native, visually coherent:** AWS, Azure, and GCP services retain recognizable provider identity inside one consistent UI.
5. **Decisions over decoration:** boundaries, connections, annotations, and diffs carry more value than ornamental styling.

## 6. MVP scope

### 6.1 Accounts and profiles

- Email or social sign-in.
- Profile with name, role, organization, bio, provider expertise, published posts, and contribution activity.
- Follow authors and topics.
- Public activity attribution for posts, comments, forks, reviews, and versions.

### 6.2 Discovery and reading

- Home feed with recent, popular, and followed content.
- Search by title, service, provider, pattern, author, and tag.
- Topic and provider filters.
- Architecture-post reading view containing author metadata, problem, approach, trade-offs, interactive diagram, version, engagement, and contribution status.
- Like/bookmark, share, follow, and report actions.

### 6.3 Post authoring

- Create draft with title, summary, problem, approach, trade-offs, tags, and embedded architecture canvas.
- Rich-text basics: headings, paragraphs, lists, links, code blocks, and callouts.
- Draft autosave and explicit preview.
- Publish, unpublish, and edit a post.
- Select a cover provider, difficulty, and intended audience.

### 6.4 Architecture canvas

- Infinite or generously bounded pan-and-zoom workspace.
- Searchable AWS, Azure, and GCP service library.
- Add, select, move, duplicate, rename, and delete service nodes.
- Create, label, redirect, and delete connections.
- Containers for accounts, subscriptions/projects, regions, availability zones, VPCs/VNets, and logical groups.
- Snap-to-grid, alignment guides, undo/redo, keyboard deletion, and multi-select.
- Node properties including display label, short description, service type, and resilience flags.
- Save as a new version; show saved/unsaved state.
- Accessible list representation for users who cannot operate a spatial canvas.

The prototype now includes a searchable catalog of 320 AWS services across 21 categories. Its network library supports VPC and Availability Zone boundaries, public and private subnets, NAT and Internet gateways, route tables, network ACLs, security groups, and VPC endpoints. Services can be dragged into subnet boundaries or assigned from their properties, and connections can be drawn between services and subnets to represent routes such as public subnet → NAT gateway → private subnet.

The reference image informs the MVP’s use of nested account boundaries, labeled horizontal/vertical service lanes, directional connections, and color-coded provider services. The product should preserve those information-design strengths while reducing label density and improving editability.

### 6.5 Discussion and feedback

- Post-level threaded comments.
- Diagram comments pinned to a node or coordinate.
- Mentions and notifications.
- Resolve/reopen threads for design review.
- Basic moderation: edit own comment, delete own comment, report abuse, author lock.

### 6.6 Forks, pull requests, and versions

- Fork creates a new editable architecture linked to its source and current base version.
- Fork owner can publish independently or submit a pull request to the source author.
- Pull request includes title, rationale, before/after versions, changed nodes/connections, discussion, and status.
- Author can approve and merge, request changes, reject, or close.
- Merge creates a new canonical architecture version and preserves attribution.
- Version history lists author, timestamp, summary, parent version, and related pull request.
- Visual diff highlights added, removed, moved, and modified elements.
- MVP conflicts are detected at the element level and resolved manually by the author; automatic three-way diagram merge is deferred.

### 6.7 Notifications

- In-app notifications for comments, mentions, follows, forks, pull requests, review decisions, and merges.
- Configurable email digest after MVP stabilization.

## 7. Primary user flows

### Publish an architecture post

1. User chooses **Publish** and starts a draft.
2. User writes the challenge and approach.
3. User opens the canvas, adds provider services, groups them, and connects them.
4. User saves a named architecture version.
5. User previews the combined post, adds tags, and publishes.
6. The post enters discovery and followers are notified.

### Fork and propose an improvement

1. Reader chooses **Fork** on a published architecture.
2. System creates a personal branch linked to the source version.
3. Contributor edits the canvas and saves one or more versions.
4. Contributor chooses **Create pull request**, writes a title and rationale, and submits.
5. Source author receives a notification and opens the visual diff.
6. Author comments, requests changes, rejects, or approves and merges.
7. On merge, the canonical post receives a new version and contributor attribution.

### Discuss a design decision

1. Reader opens the Discussion tab or selects a service node and adds a pinned comment.
2. Author and other participants reply in a thread.
3. The author optionally marks the thread resolved; the discussion remains in history.

### Review version history

1. User opens Versions on a post.
2. User selects any two compatible versions.
3. System shows metadata and a visual element-level diff.
4. User can open, fork, or link to a historical version.

## 8. Information architecture

- `/` — discovery feed
- `/search` — search and filters
- `/post/:slug` — article, interactive architecture, discussion, versions
- `/new` and `/post/:id/edit` — post composer
- `/architecture/:id/edit` — full canvas editor
- `/pull/:id` — change summary, visual diff, review conversation, decision controls
- `/profile/:handle` — posts, forks, contributions, expertise
- `/notifications` — activity inbox

The initial prototype intentionally compresses the post, diagram, discussion, version list, and contribution summary into one coherent experience, with the full editor as its second surface.

## 9. Functional requirements

### Permissions

- Anyone may read public posts.
- Signed-in users may comment, like, bookmark, fork, and submit pull requests.
- Authors and designated collaborators may edit the canonical post.
- Only authorized maintainers may merge or reject pull requests.
- Private/team content must never appear in public search or unauthenticated APIs.

### Version model

- Every saved architecture version is immutable.
- A working draft references a parent version and stores mutable canvas state.
- Published posts reference one canonical architecture version.
- A merge creates a new version rather than mutating an existing one.
- All changes store actor, timestamp, summary, and parent identifiers.

### Canvas document shape

- `nodes`: stable ID, provider, service type, position, size, label, metadata, parent container.
- `edges`: stable ID, source/target IDs and ports, label, route points, style, metadata.
- `groups`: stable ID, type, label, bounds, parent group.
- `viewport`: zoom and center (user preference, not semantic content).
- `schemaVersion`: supports migrations as the canvas evolves.

## 10. Technical requirements

### Suggested architecture

- Web client: React/TypeScript with a canvas/graph library selected after interaction benchmarking.
- API: typed HTTP endpoints or GraphQL with authorization enforced server-side.
- Primary data: relational database for users, posts, versions, comments, and pull requests.
- Object storage: exported images, attachments, and snapshots.
- Search: start with database full-text search; graduate to a dedicated search service when relevance and scale require it.
- Background jobs: notifications, indexing, diagram previews, and health analysis.
- Real-time transport: WebSocket/SSE for presence and comment updates; collaborative editing is a later phase.

### Performance

- Public article LCP target under 2.5 seconds at the 75th percentile on a mid-tier mobile connection.
- Canvas ready for interaction within 2 seconds for a typical 50-node diagram.
- Maintain 50–60 fps while panning a 200-node diagram on supported desktop hardware.
- Autosave acknowledgement under 750 ms at the 95th percentile, excluding offline periods.
- Paginate comments, versions, and search results.

### Reliability and data safety

- Draft autosave with local recovery after network interruption.
- Idempotent version and pull-request creation.
- Optimistic concurrency check on branch updates.
- Daily backups and point-in-time recovery for production data.
- Export architecture as JSON and PNG/SVG where supported.

### Security and privacy

- Server-side authorization for every post, version, comment, fork, and review action.
- Secure session cookies, CSRF protection, rate limiting, and abuse controls.
- Sanitize rich text and comments; reject executable diagram metadata.
- Encrypt data in transit and at rest.
- Audit sensitive actions such as visibility changes, collaborator changes, merges, and deletions.
- Support account deletion, content export, and retention policies.

### Accessibility

- Meet WCAG 2.2 AA for core reading, authoring, and review flows.
- Full keyboard support for menus, node selection, movement, creation, deletion, and property editing.
- Visible focus, sufficient contrast, reduced-motion support, and non-color diff indicators.
- Canvas elements exposed through an ordered semantic list and meaningful accessible names.
- Text and controls remain usable at 200% zoom.

### Observability

- Structured logs and trace IDs across publish, save, fork, submit, review, and merge flows.
- Metrics for latency, save failures, merge failures, queue delay, and client crashes.
- Product events covering activation and collaboration funnels without storing diagram prose unnecessarily.

## 11. Data entities

- User, Profile, Follow
- Post, PostRevision, Tag, Topic
- Architecture, ArchitectureDraft, ArchitectureVersion
- CanvasNode, CanvasEdge, CanvasGroup (stored as versioned document data)
- ForkRelationship, Branch
- PullRequest, PullRequestReview, PullRequestComment
- CommentThread, Comment, Reaction
- Notification, Bookmark
- Team, Membership, Role (post-MVP unless needed for private beta)

## 12. MVP acceptance criteria

- A user can read a realistic architecture post and interact with its architecture, discussion, and version views.
- A user can enter the full editor, add and reposition services, edit a service name, zoom, and save a version.
- AWS, Azure, and GCP provider categories are represented in the service library; the first release may have a deliberately limited catalog.
- A user can fork an architecture and see clear fork state.
- A contributor can submit a pull-request title and summary.
- An author can see an open contribution and reach a review surface.
- Core layouts work on desktop and remain readable on mobile; spatial editing may use a horizontally scrollable minimum workspace on small screens.
- Keyboard focus, labels, and contrast support the core flows.

## 13. Analytics

Track privacy-conscious events for: account created, draft started, first node added, diagram saved, post published, post viewed, architecture opened, comment created, fork created, pull request submitted, review completed, pull request merged, search performed, and follow created.

Key funnels:

- signup → first node → first save → first publish
- post view → canvas interaction → fork → pull request
- pull request received → reviewed → merged/requested changes

## 14. Rollout plan

### Phase 0 — Prototype

Validate editorial/canvas integration, information density, provider library navigation, and the fork-to-PR mental model with 8–12 cloud professionals.

### Phase 1 — Private MVP

Launch accounts, public posts, core canvas editing, comments, forks, pull requests, manual merges, and version history to a curated creator cohort.

### Phase 2 — Community beta

Add search quality, moderation, notifications, profiles, bookmarks, stronger diffs, exports, and creator analytics.

### Phase 3 — Team workflows

Add private workspaces, roles, architecture review policies, reusable organization templates, SSO, and audit exports.

## 15. Future enhancements

- Real-time multiplayer canvas editing, presence, and cursors.
- Infrastructure-as-code import/export for Terraform, CloudFormation, Bicep, and Google Cloud formats.
- AI-assisted diagram creation from prose, architecture explanation, risk detection, and provider migration suggestions with human confirmation.
- Automated Well-Architected checks, cost ranges, carbon signals, and compliance overlays.
- Runnable reference architectures and sandbox deployment links.
- Embeddable interactive diagrams for external blogs and documentation.
- Template marketplace, architecture challenges, reputation, badges, and maintainer programs.
- Cross-provider service mapping and guided migration forks.
- Architecture decision records linked to nodes and versions.
- Mobile review and commenting optimized for approvals rather than full editing.

## 16. Open questions

- Should authors be able to disable forks on public posts, or only restrict pull requests?
- What is the minimum provider-service catalog needed for credible launch content?
- Should post prose and diagram changes share one pull request or remain independently versioned?
- How should licensing and attribution work for public architecture reuse?
- Which automated health checks can be shown without implying certification?
- What moderation and reputation controls are required before open signup?
