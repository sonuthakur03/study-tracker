require("dotenv").config();
const mongoose = require("mongoose");
const { AdminSubject } = require("../models/adminModels");

// ─────────────────────────────────────────────────────────────────────────────
// TU BCA 6th Semester Data
// Based on official Tribhuvan University syllabus: Year III / Semester VI
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECTS_SEM6 = [
  {
    name: "Mobile Programming",
    code: "CACS351",
    semester: "6th",
    color: "#10B981", // Emerald Green
    description:
      "Android application development with UI, Activity Lifecycle, Fragments, RecyclerView, SQLite, REST/JSON APIs, Google Maps, and iOS Swift fundamentals.",
    topics: [
      // Unit 1
      "Unit 1: Introduction to Mobile & Mobile Programming — Platforms, Architectures, OS Ecosystems",
      "Unit 1: Mobile Device Categories, Features, Constraints, and Toolchains",
      // Unit 2
      "Unit 2: Android Programming Intro — Android Platform, SDK Setup & Android Studio",
      "Unit 2: Android Project Structure, Gradle Build System, XML Layout Preview & Emulator Run",
      // Unit 3
      "Unit 3: Designing UI — Layouts: Linear, Relative, Table, Frame, and ConstraintLayout",
      "Unit 3: Android Widgets — TextView, EditText, Button, CheckBox, RadioButton, Spinner",
      "Unit 3: Event Handling in Android — Listeners, Custom Drawables, Color & String Resources",
      // Unit 4
      "Unit 4: Android Activity — Activity Lifecycle callbacks (onCreate, onStart, onResume, onPause, onStop, onDestroy)",
      "Unit 4: Creating Multiple Activities & AndroidManifest.xml configuration",
      "Unit 4: Intents & Intent Filters — Explicit vs Implicit Intents, Passing Data with Bundles & Extras",
      "Unit 4: Returning Results from Child Activities (startActivityForResult / ActivityResultLauncher)",
      // Unit 5
      "Unit 5: UI Fragments — Fragment Lifecycle, FragmentManager, Dynamic Fragment Transactions",
      "Unit 5: Activity vs Fragment Communication & Multi-pane Layouts",
      "Unit 5: Android Menus — Options Menu, Context Menu, Popup Menu",
      "Unit 5: Android Dialogs — AlertDialog, DatePickerDialog, TimePickerDialog, Custom Dialogs",
      // Unit 6
      "Unit 6: List Views & Adapters — ListView, BaseAdapter & ArrayAdapter",
      "Unit 6: GridView implementation & Custom Grid Adapters",
      "Unit 6: Modern RecyclerView — ViewHolder Pattern, LayoutManagers (Linear, Grid, Staggered), Item Click Listeners",
      // Unit 7
      "Unit 7: Local Database with SQLite — SQLiteOpenHelper, Database Schema, CRUD Operations",
      "Unit 7: Remote Data & REST APIs — JSON Parsing, Volley/Retrofit HTTP Networking, Background Threads",
      "Unit 7: Location & Maps — Google Maps API Integration, Markers, Location Permissions",
      "Unit 7: App Publishing — Generating Signed APK/AAB, Google Play Console Guidelines",
      // Unit 8
      "Unit 8: iOS Programming Intro — iOS Platform, Xcode Environment Setup, Interface Builder",
      "Unit 8: Swift Language Fundamentals — Optionals, Structs, Classes, Protocols",
      "Unit 8: iOS UI Architecture — Storyboards, ViewControllers, Views Hierarchy & AutoLayout",
      // Lab
      "Lab: Build a Student Information App with SQLite CRUD operations",
      "Lab: Build a Weather/News App fetching live data via REST API & RecyclerView",
      "Lab: Implement a Simple Location-aware Map Application",
    ],
  },
  {
    name: "Distributed Systems",
    code: "CACS352",
    semester: "6th",
    color: "#6366F1", // Indigo
    description:
      "Modern distributed computing: architectures, processes, RPC/RMI communication, logical clocks, mutual exclusion, consensus, replication, fault tolerance, and security.",
    topics: [
      // Unit 1
      "Unit 1: Introduction — Definition, Goals (Resource Sharing, Openness, Scalability, Transparency)",
      "Unit 1: Types of Distributed Systems — Distributed Computing, Information, and Pervasive Systems",
      "Unit 1: Case Study: World Wide Web architecture",
      // Unit 2
      "Unit 2: Architecture — Architectural Styles (Layered, Object-based, Event-based, Shared Data-space)",
      "Unit 2: System Architectures — Centralized (Client-Server), Decentralized (P2P), Hybrid Systems",
      "Unit 2: Middleware Organization & Interceptors",
      // Unit 3
      "Unit 3: Processes — Threads in Distributed Systems, Virtualization (Hypervisors & Containers)",
      "Unit 3: Clients & Servers — Stateful vs Stateless Servers, Server Clusters",
      "Unit 3: Code Migration — Approaches, Heterogeneous Code Migration",
      // Unit 4
      "Unit 4: Communication — Foundations, Layered Protocols, RPC (Remote Procedure Call) Architecture",
      "Unit 4: Message-Oriented Communication — Transient vs Persistent Messaging, Message Queues",
      "Unit 4: Multicast Communication — Tree-based, Overlay, and Epidemic Multicasting",
      "Unit 4: Case Study: Java RMI and Message Passing Interface (MPI)",
      // Unit 5
      "Unit 5: Naming — Names, Identifiers, and Addresses; Flat Naming (Home-based, DHT/Chord)",
      "Unit 5: Structured Naming — Name Spaces, Resolution, DNS implementation",
      "Unit 5: Attribute-Based Naming — Directory Services (LDAP), RDF",
      // Unit 6
      "Unit 6: Coordination — Clock Synchronization (Physical Clocks: Cristian's, NTP)",
      "Unit 6: Logical Clocks — Lamport's Logical Clocks & Vector Clocks",
      "Unit 6: Mutual Exclusion Algorithms — Centralized, Distributed (Ricart-Agrawala), Token Ring",
      "Unit 6: Election Algorithms — Bully Algorithm, Ring Algorithm",
      "Unit 6: Distributed Event Matching & Gossip-Based Information Dissemination",
      // Unit 7
      "Unit 7: Consistency & Replication — Reasons for Replication, Data-Centric Consistency Models (Strict, Sequential, Causal)",
      "Unit 7: Client-Centric Consistency Models (Monotonic Read/Write, Read-Your-Writes, Writes-Follow-Reads)",
      "Unit 7: Replica Management & Consistency Protocols (Primary-based, Quorum-based)",
      "Unit 7: Caching and Replication in Web Systems",
      // Unit 8
      "Unit 8: Fault Tolerance — Basic Concepts, Failure Models (Crash, Omission, Byzantine)",
      "Unit 8: Process Resilience — Process Groups, Failure Masking & Consensus",
      "Unit 8: Reliable Client-Server & Group Communication",
      "Unit 8: Distributed Commit Protocols — Two-Phase Commit (2PC) and Three-Phase Commit (3PC)",
      "Unit 8: Recovery — Checkpointing & Message Logging",
      // Unit 9
      "Unit 9: Security — Security Channels (Authentication, Confidentiality, Integrity), SSL/TLS",
      "Unit 9: Access Control & Authorization (Firewalls, Capabilities, ACLs), Secure Naming",
    ],
  },
  {
    name: "Applied Economics",
    code: "CAEC353",
    semester: "6th",
    color: "#F59E0B", // Amber
    description:
      "Economic theories and applications in IT & business decision-making: Demand/Supply elasticity, Consumer behavior, Cost/Revenue curves, Market structures, National Income, and Banking in Nepal.",
    topics: [
      // Unit 1
      "Unit 1: Introduction — Concepts of Microeconomics and Macroeconomics",
      "Unit 1: Distinction between Microeconomics & Macroeconomics; Goals and Instruments of Macro Policy",
      // Unit 2
      "Unit 2: Elasticity of Demand — Price, Income, and Cross Elasticity concepts",
      "Unit 2: Measurement of Elasticity — Total Outlay Method, Point Method, Arc Method",
      "Unit 2: Elasticity of Supply — Concept, Determinants, and Measurement",
      "Unit 2: Numerical Exercises on Demand & Supply Elasticity using Microsoft Excel",
      // Unit 3
      "Unit 3: Theory of Consumer Behavior — Cardinal vs Ordinal Utility Analysis",
      "Unit 3: Cardinal Utility: Law of Diminishing Marginal Utility & Consumer Equilibrium",
      "Unit 3: Ordinal Utility: Indifference Curve Properties, Marginal Rate of Substitution (MRS), Budget Line",
      "Unit 3: Consumer Equilibrium via Ordinal Approach, Price Effect (PCC) & Income Effect (ICC)",
      "Unit 3: Decomposition of Price Effect into Substitution and Income Effect (Hicksian Approach)",
      "Unit 3: Numerical Exercises on Consumer Utility & Indifference Curves",
      // Unit 4
      "Unit 4: Cost & Revenue Curves — Actual, Opportunity, Implicit, Explicit, Accounting & Economic Costs",
      "Unit 4: Short-Run Cost Curves: Total, Average, Marginal Costs (TFC, TVC, TC, AFC, AVC, AC, MC)",
      "Unit 4: Long-Run Cost Curves: Long Run Average Cost (LAC) as Envelope Curve",
      "Unit 4: Revenue Curves under Perfect Competition vs Imperfect Competition (TR, AR, MR)",
      "Unit 4: Numerical Cost-Revenue Analysis in Excel",
      // Unit 5
      "Unit 5: Market Structure — Perfect Competition: Meaning, Characteristics, Short-Run & Long-Run Equilibrium (TR-TC and MR-MC Approaches)",
      "Unit 5: Monopoly Market: Meaning, Price-Output Determination, Price Discrimination (1st, 2nd, 3rd Degree)",
      "Unit 5: Monopolistic Competition: Features, Short/Long Run Equilibrium, Selling Costs & Product Differentiation",
      "Unit 5: Oligopoly: Characteristics, Kinked Demand Curve Model, Cartel & Collusive Pricing",
      "Unit 5: Numerical Market Profit Maximization Exercises in Excel",
      // Unit 6
      "Unit 6: National Income Accounting — Circular Flow of Income in 2-Sector, 3-Sector, and 4-Sector Economies",
      "Unit 6: National Income Concepts: GDP, NDP, GNP, NNP (at Market Price and Factor Cost)",
      "Unit 6: Personal Income (PI), Disposable Personal Income (DPI), Per Capita Income (PCI), Real vs Nominal GDP & GDP Deflator",
      "Unit 6: Methods of Measuring National Income: Product, Income, and Expenditure Methods; Difficulties in Nepal",
      "Unit 6: National Income Computation in Excel",
      // Unit 7
      "Unit 7: Money, Banking and International Trade — Concepts & Functions of Money, Money Supply ($M_1, M_2, M_3$)",
      "Unit 7: Inflation: Demand-Pull vs Cost-Push Inflation, Causes, Effects, and Remedies",
      "Unit 7: Commercial Banking Functions, Credit Creation Process",
      "Unit 7: Role & Monetary Policy of Central Bank with specific reference to Nepal Rastra Bank (NRB)",
      "Unit 7: International Trade: Internal vs International Trade, Balance of Trade (BOT) & Balance of Payments (BOP) in Nepal context",
    ],
  },
  {
    name: "Advanced Java Programming",
    code: "CACS354",
    semester: "6th",
    color: "#8B5CF6", // Purple
    description:
      "Enterprise Java: Swing GUI programming, Event Handling, Database Connectivity (JDBC), JavaBeans Component Model, Servlets & JSP Web Applications, and Java RMI.",
    topics: [
      // Unit 1
      "Unit 1: GUI Programming — Introduction to Java Swing, Swing vs AWT Architecture",
      "Unit 1: Creating Frames (JFrame), Panels (JPanel), Working with 2D Shapes, Custom Colors & Fonts",
      "Unit 1: Swing Components: JLabel, JTextField, JPasswordField, JButton, JCheckBox, JRadioButton, JComboBox, JTable, JTree",
      "Unit 1: Event Handling: Delegation Event Model, Event Classes, Event Listeners, Adapter Classes, Anonymous Inner Classes",
      "Unit 1: Layout Management: FlowLayout, BorderLayout, GridLayout, GridBagLayout, BoxLayout, CardLayout",
      "Unit 1: Menu Components: JMenuBar, JMenu, JMenuItem, JCheckBoxMenuItem, JRadioButtonMenuItem, PopupMenu",
      // Unit 2
      "Unit 2: Database Programming with JDBC — JDBC Architecture, JDBC Driver Types (1, 2, 3, 4)",
      "Unit 2: Establishing Database Connections via DriverManager & DataSource",
      "Unit 2: Executing Queries: Statement, PreparedStatement, CallableStatement",
      "Unit 2: ResultSet Handling: Scrollable, Updatable ResultSets, ResultSetMetaData, DatabaseMetaData",
      "Unit 2: RowSet Framework: JdbcRowSet, CachedRowSet, WebRowSet, FilteredRowSet",
      "Unit 2: Transaction Management in JDBC: Commit, Rollback, Savepoints",
      // Unit 3
      "Unit 3: JavaBeans — Concept, Benefits of Components, Java Bean Conventions",
      "Unit 3: Bean Properties: Simple, Indexed, Bound, and Constrained Properties",
      "Unit 3: Introspection & BeanInfo Interface, Customizers, Bean Persistence & Serialization",
      // Unit 4
      "Unit 4: Servlets & Web Applications — HTTP Protocol, Web Server vs Application Server, Servlet Architecture",
      "Unit 4: Servlet Lifecycle (init, service, destroy), GenericServlet vs HttpServlet",
      "Unit 4: Handling HTTP Requests & Responses: Parameters, Headers, Status Codes",
      "Unit 4: Session Management: Cookies, URL Rewriting, Hidden Form Fields, HttpSession API",
      "Unit 4: Servlet Collaboration: RequestDispatcher (forward & include), SendRedirect, ServletContext & ServletConfig",
      "Unit 4: JavaServer Pages (JSP) — Architecture, Lifecycle, JSP Scripting Elements (Declarations, Scriptlets, Expressions)",
      "Unit 4: JSP Directives (page, include, taglib), JSP Action Tags, Standard Tag Library (JSTL), Servlets vs JSP",
      "Unit 4: Overview of Modern Java Web Frameworks (Spring Boot, Jakarta EE)",
      // Unit 5
      "Unit 5: Remote Method Invocation (RMI) — Distributed Object Model, Roles of Client and Server",
      "Unit 5: Remote Interface, Remote Object Implementation, Parameter Marshalling & Unmarshalling",
      "Unit 5: Stubs & Skeletons, RMI Registry (rmiregistry), Naming/LocateRegistry lookup",
      "Unit 5: Building a Complete Client-Server RMI Application; RMI vs CORBA",
      // Lab
      "Lab: Build a Swing Desktop GUI application with full Event Listeners and Layouts",
      "Lab: Implement a Complete Database CRUD application using JDBC PreparedStatement",
      "Lab: Build an Authentication & Session-managed Web Portal using Servlets and JSP",
      "Lab: Implement a Client-Server Distributed Calculation Application using Java RMI",
    ],
  },
  {
    name: "Network Programming",
    code: "CACS355",
    semester: "6th",
    color: "#06B6D4", // Cyan
    description:
      "In-depth network programming with Java: InetAddress, URLs/URIs, HTTP connections, Client Sockets, Multithreaded ServerSockets, SSL/TLS, Non-blocking I/O (NIO), UDP, and IP Multicast.",
    topics: [
      // Unit 1
      "Unit 1: Introduction — Network Programming Scope, Client-Server Architecture, Network Software Design",
      "Unit 1: Network Tools, Protocols (OSI vs TCP/IP), Port Numbers & Socket Abstraction",
      // Unit 2
      "Unit 2: Internet Addresses — InetAddress Class: Factory Methods, Hostname Resolution, IP Lookups",
      "Unit 2: Getter Methods, Testing Reachability, Inet4Address vs Inet6Address, NetworkInterface Class",
      "Unit 2: Practical Programs: SpamCheck tool, Web Server Logfile IP Resolver",
      // Unit 3
      "Unit 3: URLs and URIs — Creating URLs, Relative URLs, Parsing URL Components",
      "Unit 3: URI Class: Parts of a URI, Relative vs Absolute URIs, Resolving URIs",
      "Unit 3: x-www-form-urlencoded Data: URLEncoder and URLDecoder",
      "Unit 3: Proxies: System Properties, Proxy Class, ProxySelector",
      "Unit 3: Server-Side Communication: GET Requests, Password-Protected Sites via Authenticator & PasswordAuthentication",
      // Unit 4
      "Unit 4: HTTP Protocol — Keep-Alive Protocol, HTTP Request/Response Methods & Headers",
      "Unit 4: HTTP Request Body, Cookie Management with CookieManager and CookieStore",
      // Unit 5
      "Unit 5: URLConnections — Opening Connections, Reading Response Streams & Header Fields",
      "Unit 5: Configuring Connection: timeouts, doInput, doOutput, ifModifiedSince, Web Cache for Java",
      "Unit 5: HttpURLConnection Class: Request Methods, Server Redirects, Response Codes, Streaming Mode",
      // Unit 6
      "Unit 6: Sockets for Clients — Socket Construction, Connecting to Remote Hosts, Investigating Protocols with Telnet",
      "Unit 6: Reading from and Writing to Sockets with Streams, Socket Addresses (InetSocketAddress)",
      "Unit 6: Socket Options: SO_TIMEOUT, TCP_NODELAY, SO_LINGER, SO_RCVBUF, SO_SNDBUF, SO_KEEPALIVE",
      "Unit 6: Building Socket Client Applications (e.g. Whois GUI Client, Port Scanner)",
      // Unit 7
      "Unit 7: Sockets for Servers — ServerSocket Class: Binding, Listening, and Accepting Connections",
      "Unit 7: Serving Binary Data, Multithreaded Server Architectures (Thread per Connection & Thread Pooling)",
      "Unit 7: ServerSocket Options, Server Logging Techniques",
      "Unit 7: Building a Custom Single-File & Redirecting HTTP Web Server",
      // Unit 8
      "Unit 8: Secure Sockets — SSL/TLS Protocol Concepts, Creating Secure Client Sockets (SSLSocket)",
      "Unit 8: Creating Secure Server Sockets (SSLServerSocket), Cipher Suites, Session Management, Client Authentication",
      // Unit 9
      "Unit 9: Non-blocking I/O (NIO) — Buffers: Allocation, Filling, Draining, Flipping, Compacting, Slicing, ByteBuffers",
      "Unit 9: Channels: SocketChannel, ServerSocketChannel, DatagramChannel; Asynchronous Operations",
      "Unit 9: Selectors & SelectionKey: Multiplexed Non-blocking I/O Architecture",
      // Unit 10
      "Unit 10: UDP Programming — UDP Protocol Overview, DatagramPacket Class (Constructors, Buffers, Addressing)",
      "Unit 10: DatagramSocket Class: Sending, Receiving, Managing Connections, Socket Options",
      "Unit 10: Building UDP Client, UDP Server, and UDP Echo Server; DatagramChannel in NIO",
      // Unit 11
      "Unit 11: IP Multicast — Multicast Addresses (Class D), Multicast Sockets (MulticastSocket Class)",
      "Unit 11: Joining and Leaving Multicast Groups, Multicast Packet Transmission & TTL",
      // Unit 12
      "Unit 12: Remote Method Invocation (RMI) — Defining Remote Interface, Implementing Server & Client, rmiregistry Execution",
      // Lab
      "Lab: Build a Multithreaded Client-Server Chat Application using TCP Sockets",
      "Lab: Build a Custom HTTP Web Server that serves HTML files and images",
      "Lab: Build a High-Performance Non-blocking File Transfer System using Java NIO Channels & Selectors",
      "Lab: Implement a UDP Peer-to-Peer Messaging Program",
    ],
  },
  {
    name: "Project II",
    code: "CAPJ356",
    semester: "6th",
    color: "#EC4899", // Pink
    description:
      "Capstone semester project: Proposal formulation, system design, modern technology stack implementation, collaborative git workflow, formal IEEE-standard documentation, and viva presentation.",
    topics: [
      // Unit 1
      "Unit 1: Project Ideas & Proposal Guidance — Problem Identification, Feasibility Study, Scope & Objectives",
      "Unit 1: Proposal Writing Techniques: Introduction, Problem Statement, Methodology, Gantt Chart, Deliverables",
      // Unit 2
      "Unit 2: Application Development — Object-Oriented Design Principles (SOLID), Architecture Selection (MVC, Microservices)",
      "Unit 2: Frameworks & REST APIs Integration (React, Node.js, Spring Boot, FastAPI, Flutter, Android/iOS)",
      "Unit 2: Design Patterns, Database Schema Design (SQL/NoSQL), Data Collection & Pipeline Setup",
      "Unit 2: Hardware Acceleration & GPU Applications in Modern Projects (where applicable)",
      // Unit 3
      "Unit 3: Project Management & Collaboration — Project Management Plan, Milestones & Deliverables",
      "Unit 3: Collaborative Development with Git & GitHub (Branching Strategy, Pull Requests, Code Reviews)",
      "Unit 3: Team Communication, Sprint Planning, and Effective Meeting Coordination",
      // Unit 4
      "Unit 4: Project Guidance & Supervisor Consultation — Weekly Progress Tracking & Advisory Milestones",
      // Unit 5
      "Unit 5: Core Project Implementation — Frontend Development, Backend API Engineering, Database Integration, Unit & System Testing",
      // Unit 6
      "Unit 6: Project Documentation Guidance — TU BCA Standard Report Formatting (Chapters: Intro, System Analysis, Design, Implementation, Testing, Conclusion)",
      "Unit 6: Figures, System Diagrams (ERD, DFD, UML Class/Sequence), Mathematical Equations, Tables formatting",
      "Unit 6: References & Citations (IEEE / APA Formatting), Executive Summary & Abstract Writing",
      "Unit 6: Final Project Defense & Viva Preparation",
    ],
  },
];

const seedSem6 = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Remove old 5th sem subjects and re-populate with 6th sem
    await AdminSubject.deleteMany({});
    console.log("🗑️  Cleared existing subjects");

    const created = await AdminSubject.insertMany(
      SUBJECTS_SEM6.map((s) => ({
        ...s,
        topics: s.topics.map((t, idx) => ({ title: t, order: idx })),
      }))
    );

    console.log(`🎉 Successfully seeded ${created.length} 6th Semester subjects with full syllabus topics:`);
    created.forEach((s) => {
      console.log(`   📚 ${s.name} (${s.code}) — ${s.topics.length} topics`);
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
};

seedSem6();
