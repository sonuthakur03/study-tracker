require("dotenv").config();
const mongoose = require("mongoose");
const { AdminSubject } = require("../models/adminModels");
const { Assignment, Schedule } = require("../models/index");
const User = require("../models/User");

// ─────────────────────────────────────────────────────────────────────────────
// TU BCA 5th Semester Data
// Based on official syllabus: Year III / Semester V
// ─────────────────────────────────────────────────────────────────────────────

const SUBJECTS = [
  {
    name: "MIS and E-Business",
    code: "CACS301",
    semester: "5th",
    color: "#6366F1",
    description:
      "Management Information Systems, E-Commerce, E-Business infrastructure and security.",
    topics: [
      // Unit 1 - E-Commerce
      "Unit 1: Introduction to E-Commerce — Definitions, Concepts, EC Framework",
      "Unit 1: Classification of EC — B2B, B2C, C2C, G2C",
      "Unit 1: Benefits & Limitations of E-Commerce",
      "Unit 1: Social Networks & M-Commerce concepts",
      "Unit 1: Location-based I-Commerce & Applications",
      // Unit 2 - Network Infrastructure
      "Unit 2: Network Infrastructure — Information Superhighway (I-Way)",
      "Unit 2: Wireless Application Protocol (WAP) — Architecture & Working",
      "Unit 2: Wireless Technologies — ADSL, WiMAX, WLAN, 3G, 4G, 5G",
      // Unit 3 - MIS
      "Unit 3: Introduction to MIS — Data, Information, CBIS",
      "Unit 3: TPS, DSS, EIS — Types of Information Systems",
      "Unit 3: SCM, CRM and Enterprise Systems",
      "Unit 3: International Information Systems — Outsourcing & Off-shoring",
      // Unit 4 - Security
      "Unit 4: E-Commerce Security — CIA Triad, Authentication, Authorization",
      "Unit 4: Technical Attacks — Malware, Viruses, Trojans, DoS, Botnets",
      "Unit 4: Security Technologies — Firewalls, VPN, SSL/TLS, Digital Signatures",
      // Unit 5 - Payment Systems
      "Unit 5: Electronic Payment Systems — Credit cards, Digital wallets",
      "Unit 5: E-Banking — NetBanking, Mobile Banking in Nepal context",
      "Unit 5: eSewa, Khalti, ConnectIPS — Nepali digital payment overview",
      // Unit 6 - Web Server & Deployment
      "Unit 6: Web Server Concepts — Apache, IIS, Nginx",
      "Unit 6: Hosting & Deploying Web Applications on Server",
      // Lab
      "Lab: Build a simple E-Commerce product listing page (HTML/CSS)",
      "Lab: Implement a basic shopping cart with JavaScript",
      "Lab: Deploy a web application on a local server",
    ],
  },
  {
    name: "DotNet Technology",
    code: "CACS302",
    semester: "5th",
    color: "#8B5CF6",
    description:
      "C# programming language and .NET framework — from basics to web applications with ASP.NET.",
    topics: [
      // Unit 1 - .NET Framework
      "Unit 1: Introduction to .NET Framework — CLR, CTS, CLS",
      "Unit 1: Object Orientation in C# — Encapsulation, Inheritance, Polymorphism",
      "Unit 1: Memory Management — Garbage Collection in .NET",
      "Unit 1: Platform Support — .NET vs .NET Core vs .NET 5+",
      // Unit 2 - C# Basics
      "Unit 2: C# Data Types — int, float, string, bool, char, decimal",
      "Unit 2: Variables, Constants, Operators in C#",
      "Unit 2: Control Statements — if/else, switch, loops (for, while, foreach)",
      "Unit 2: Arrays, Collections — List, Dictionary, ArrayList",
      "Unit 2: Namespaces and using directives",
      // Unit 3 - Types in C#
      "Unit 3: Classes and Objects — Fields, Properties, Methods, Constructors",
      "Unit 3: Inheritance and Method Overriding in C#",
      "Unit 3: Abstract Classes and Interfaces",
      "Unit 3: Access Modifiers — public, private, protected, internal",
      "Unit 3: Structs, Enums, and Generics",
      // Unit 4 - Advanced C#
      "Unit 4: Delegates and Events in C#",
      "Unit 4: Lambda Expressions and Anonymous Methods",
      "Unit 4: Exception Handling — try, catch, finally, custom exceptions",
      "Unit 4: Introduction to LINQ — Querying collections and databases",
      "Unit 4: Working with Databases — ADO.NET, Entity Framework basics",
      "Unit 4: ASP.NET Web Applications — MVC pattern, Razor pages",
      // Lab
      "Lab: Console app — Student grade calculator using C#",
      "Lab: OOP program — Bank Account class with inheritance",
      "Lab: LINQ queries on a list of student objects",
      "Lab: Simple ASP.NET CRUD web app with database",
    ],
  },
  {
    name: "Computer Networking",
    code: "CACS303",
    semester: "5th",
    color: "#10B981",
    description:
      "Computer networks from physical layer to application layer — protocols, routing, and security.",
    topics: [
      // Unit 1 - Introduction
      "Unit 1: Introduction to Computer Networks — Types, Topologies, Uses",
      "Unit 1: Network Hardware — Hubs, Switches, Routers, NICs",
      "Unit 1: OSI Reference Model — All 7 layers and their functions",
      "Unit 1: TCP/IP Model — 4 layers comparison with OSI",
      // Unit 2 - Physical Layer
      "Unit 2: Physical Layer — Transmission Media (Guided & Unguided)",
      "Unit 2: Bandwidth, Throughput, Latency concepts",
      "Unit 2: Encoding Techniques — NRZ, Manchester, Differential Manchester",
      // Unit 3 - Data Link Layer
      "Unit 3: Data Link Layer — Framing, Error Detection & Correction",
      "Unit 3: Error Detection — Parity, CRC, Checksum",
      "Unit 3: Error Correction — Hamming Code",
      "Unit 3: Flow Control — Stop & Wait, Sliding Window protocols",
      "Unit 3: MAC Sublayer — CSMA/CD, CSMA/CA, Ethernet",
      // Unit 4 - Network Layer
      "Unit 4: Network Layer — IP Addressing (IPv4 and IPv6)",
      "Unit 4: Subnetting and CIDR — Practice with examples",
      "Unit 4: Routing Algorithms — Distance Vector, Link State",
      "Unit 4: Routing Protocols — RIP, OSPF, BGP overview",
      "Unit 4: ICMP, ARP, DHCP protocols",
      // Unit 5 - Transport Layer
      "Unit 5: Transport Layer — TCP vs UDP comparison",
      "Unit 5: TCP — 3-way handshake, Connection management",
      "Unit 5: TCP Congestion Control and Flow Control",
      "Unit 5: Port Numbers — Well-known ports (HTTP:80, HTTPS:443, FTP:21, etc.)",
      // Unit 6 - Application Layer
      "Unit 6: DNS — Domain Name System, How name resolution works",
      "Unit 6: HTTP and HTTPS — Request/Response, Status codes",
      "Unit 6: Email Protocols — SMTP, POP3, IMAP",
      "Unit 6: FTP, Telnet, SSH protocols",
      "Unit 6: Network Security — Firewalls, VPN, SSL/TLS",
    ],
  },
  {
    name: "Introduction to Management",
    code: "CAMG304",
    semester: "5th",
    color: "#F59E0B",
    description:
      "Fundamentals of management — planning, organizing, leading, and controlling in organizations.",
    topics: [
      // Unit 1
      "Unit 1: Introduction to Management — Definitions, Nature, Scope",
      "Unit 1: Levels of Management — Top, Middle, Lower",
      "Unit 1: Management Functions — POLC Framework",
      "Unit 1: Managerial Roles — Mintzberg's 10 Roles",
      "Unit 1: Management vs Administration",
      // Unit 2
      "Unit 2: Evolution of Management — Classical, Behavioral, Modern approaches",
      "Unit 2: Scientific Management — Frederick Taylor's principles",
      "Unit 2: Administrative Management — Henri Fayol's 14 principles",
      "Unit 2: Hawthorne Studies and Human Relations Movement",
      // Unit 3
      "Unit 3: Planning — Types, Steps, Importance",
      "Unit 3: Decision Making — Types of decisions, Decision-making process",
      "Unit 3: MBO — Management by Objectives",
      "Unit 3: Strategic Planning vs Operational Planning",
      // Unit 4
      "Unit 4: Organizing — Principles, Organizational Structure",
      "Unit 4: Formal vs Informal Organization",
      "Unit 4: Delegation, Decentralization, Span of Control",
      "Unit 4: Line, Line & Staff, Functional, Committee organizations",
      // Unit 5
      "Unit 5: Staffing — Recruitment, Selection, Training, Promotion",
      "Unit 5: Human Resource Management basics",
      // Unit 6
      "Unit 6: Directing — Leadership styles, Motivation theories",
      "Unit 6: Maslow's Hierarchy of Needs",
      "Unit 6: Herzberg's Two-Factor Theory",
      "Unit 6: Communication in management",
      // Unit 7
      "Unit 7: Controlling — Process, Types, Techniques",
      "Unit 7: Management Information System for control",
    ],
  },
  {
    name: "Computer Graphics and Animation",
    code: "CACS305",
    semester: "5th",
    color: "#EC4899",
    description:
      "Computer graphics fundamentals — 2D/3D transformations, rendering, and animation concepts.",
    topics: [
      // Unit 1
      "Unit 1: Introduction to Computer Graphics — Applications, Coordinate Systems",
      "Unit 1: Raster vs Vector graphics, Resolution, Color models (RGB, CMYK)",
      "Unit 1: Display Devices — CRT, LCD, LED monitors",
      "Unit 1: Graphics Software — OpenGL overview",
      // Unit 2
      "Unit 2: Output Primitives — Line drawing algorithms (DDA, Bresenham)",
      "Unit 2: Circle drawing algorithms — Midpoint circle algorithm",
      "Unit 2: Ellipse drawing, Filled areas, Polygon filling",
      "Unit 2: Anti-aliasing techniques",
      // Unit 3
      "Unit 3: 2D Transformations — Translation, Rotation, Scaling",
      "Unit 3: Homogeneous coordinates and Matrix representation",
      "Unit 3: Composite transformations — Combining multiple transforms",
      "Unit 3: Reflection and Shearing transformations",
      "Unit 3: 2D Clipping — Cohen-Sutherland line clipping algorithm",
      // Unit 4
      "Unit 4: 3D Graphics — 3D Transformations (Translation, Rotation, Scaling)",
      "Unit 4: 3D Projections — Parallel (Orthographic, Oblique) and Perspective",
      "Unit 4: Visible Surface Detection — Painter's algorithm, Z-buffer",
      "Unit 4: Illumination Models — Ambient, Diffuse, Specular lighting",
      // Unit 5
      "Unit 5: Animation basics — Keyframe animation, Tweening",
      "Unit 5: Animation techniques — Cel animation, 3D animation",
      "Unit 5: Virtual Reality and Augmented Reality concepts",
      // Lab
      "Lab: Implement DDA and Bresenham line drawing algorithms in C/Python",
      "Lab: 2D transformation programs (rotation, scaling, translation)",
      "Lab: Polygon clipping implementation",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2-Month Schedule Generator
// Cycles all 5 subjects Mon-Fri, 1 hour each
// Starts from today
// ─────────────────────────────────────────────────────────────────────────────
function generateSchedule() {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const subjectDayMap = {
    Monday: {
      subject: "MIS and E-Business",
      startTime: "15:00",
      endTime: "17:00",
      type: "lecture",
    },
    Tuesday: {
      subject: "DotNet Technology",
      startTime: "15:00",
      endTime: "17:00",
      type: "lecture",
    },
    Wednesday: {
      subject: "Computer Networking",
      startTime: "15:00",
      endTime: "17:00",
      type: "lecture",
    },
    Thursday: {
      subject: "Introduction to Management",
      startTime: "15:00",
      endTime: "17:00",
      type: "lecture",
    },
    Friday: {
      subject: "Computer Graphics and Animation",
      startTime: "15:00",
      endTime: "17:00",
      type: "lecture",
    },
    // Labs (alternating)
  };

  // Also add lab sessions on alternate days
  const labDayMap = {
    Monday: {
      subject: "Computer Networking",
      startTime: "17:00",
      endTime: "18:00",
      type: "lab",
    },
    Wednesday: {
      subject: "DotNet Technology",
      startTime: "17:00",
      endTime: "18:00",
      type: "lab",
    },
    Friday: {
      subject: "MIS and E-Business",
      startTime: "17:00",
      endTime: "18:00",
      type: "lab",
    },
  };

  const schedule = [];
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach((day) => {
    if (subjectDayMap[day]) {
      schedule.push({ day, ...subjectDayMap[day] });
    }
    if (labDayMap[day]) {
      schedule.push({ day, ...labDayMap[day] });
    }
  });

  return schedule;
}

// ─────────────────────────────────────────────────────────────────────────────
// Assignment Ideas — spread over 2 months with due dates
// ─────────────────────────────────────────────────────────────────────────────
function generateAssignments() {
  const now = new Date();
  const week = (n) => new Date(now.getTime() + n * 7 * 24 * 60 * 60 * 1000);

  return [
    // Week 1
    {
      subject: "MIS and E-Business",
      title: "Assignment 1 — E-Commerce Classification Report",
      description:
        "Write a 2-page report comparing B2B, B2C, and C2C e-commerce with real examples from Nepal (eSewa, Daraz, Hamrobazar). Include benefits and limitations.",
      dueDate: week(1),
      priority: "medium",
    },
    {
      subject: "Computer Networking",
      title: "Assignment 1 — OSI Model Diagram & Functions",
      description:
        "Draw a detailed OSI model diagram. Write 3 functions and 1 protocol for each of the 7 layers. Compare with TCP/IP model in a table.",
      dueDate: week(1),
      priority: "medium",
    },

    // Week 2
    {
      subject: "DotNet Technology",
      title: "Lab Report 1 — C# Console Programs",
      description:
        "Submit lab report for: (1) Calculator program, (2) Student grade system with arrays, (3) Pattern printing using loops. Include source code + screenshots.",
      dueDate: week(2),
      priority: "high",
    },
    {
      subject: "Introduction to Management",
      title: "Assignment 1 — Fayol's 14 Principles with Examples",
      description:
        "Explain each of Fayol's 14 principles of management with a practical example. Choose a Nepali organization (NTC, Nepal Airlines, etc.) and apply 5 principles to it.",
      dueDate: week(2),
      priority: "low",
    },

    // Week 3
    {
      subject: "Computer Networking",
      title: "Assignment 2 — Subnetting Practice Problems",
      description:
        "Solve 10 subnetting problems: Find network address, broadcast address, valid host range, and number of hosts for given IP/CIDR. Show full working.",
      dueDate: week(3),
      priority: "high",
    },
    {
      subject: "Computer Graphics and Animation",
      title: "Lab Report 1 — Line Drawing Algorithms",
      description:
        "Implement DDA and Bresenham line drawing algorithms. Compare both in a table (speed, accuracy, disadvantages). Include screenshots of output.",
      dueDate: week(3),
      priority: "medium",
    },

    // Week 4
    {
      subject: "MIS and E-Business",
      title: "Assignment 2 — MIS Types Comparison",
      description:
        "Compare TPS, DSS, and EIS with real-world examples. Draw a pyramid diagram showing all levels. Explain how they connect to each other.",
      dueDate: week(4),
      priority: "medium",
    },
    {
      subject: "DotNet Technology",
      title: "Lab Report 2 — OOP in C#",
      description:
        "Build a Bank Account management system using C# classes. Must include: inheritance (SavingsAccount, CurrentAccount), interface (IAccount), exception handling for invalid amounts.",
      dueDate: week(4),
      priority: "high",
    },

    // Week 5
    {
      subject: "Computer Networking",
      title: "Mid-Term Prep — TCP/IP Protocol Summary",
      description:
        "Create a one-page summary sheet of: TCP 3-way handshake, UDP vs TCP comparison table, common port numbers (at least 15), and HTTP request/response flow diagram.",
      dueDate: week(5),
      priority: "high",
    },
    {
      subject: "Introduction to Management",
      title: "Assignment 2 — Motivation Theory Case Study",
      description:
        "Apply Maslow's Hierarchy and Herzberg's Two-Factor theory to a Nepali IT company scenario. Suggest 3 practical ways to motivate software developers based on the theories.",
      dueDate: week(5),
      priority: "medium",
    },

    // Week 6
    {
      subject: "Computer Graphics and Animation",
      title: "Assignment 2 — 2D Transformations Report",
      description:
        "Solve 5 numerical problems on 2D transformations (translation, rotation, scaling) using matrix method. Show all homogeneous coordinate calculations step by step.",
      dueDate: week(6),
      priority: "medium",
    },
    {
      subject: "MIS and E-Business",
      title: "Lab Report — Simple E-Commerce Website",
      description:
        "Create a simple 3-page e-commerce website: Home, Product Listing, Contact. Must use HTML/CSS. Include at least 6 products with image, name, and price.",
      dueDate: week(6),
      priority: "high",
    },

    // Week 7
    {
      subject: "DotNet Technology",
      title: "Lab Report 3 — LINQ and Database",
      description:
        "Write LINQ queries on a Student list: (1) Filter by GPA, (2) Sort by name, (3) Group by department. Also create a simple CRUD app with SQL Server/SQLite.",
      dueDate: week(7),
      priority: "high",
    },
    {
      subject: "Computer Networking",
      title: "Assignment 3 — Network Design Project",
      description:
        "Design a network for a small office with 20 computers, 1 server, 2 printers. Draw the physical and logical topology. Assign IP addresses using subnetting. Justify your choices.",
      dueDate: week(7),
      priority: "medium",
    },

    // Week 8 — Final
    {
      subject: "Computer Graphics and Animation",
      title: "Mini Project — Graphics Application",
      description:
        "Build a small graphics application: Draw shapes (line, circle, rectangle) with mouse, implement at least one 2D transformation (rotation/scaling). Use any language (C, Python, Java).",
      dueDate: week(8),
      priority: "high",
    },
    {
      subject: "Introduction to Management",
      title: "Term Paper — Management in IT Companies",
      description:
        "Write a 5-page term paper on management practices in a Nepali IT company (Deerwalk, Leapfrog, YoungInnovations, etc.). Cover: planning, organizing, leadership style, and challenges.",
      dueDate: week(8),
      priority: "high",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // 1. Create Admin Subjects
    console.log("\n📚 Seeding subjects...");
    await AdminSubject.deleteMany({});
    for (const s of SUBJECTS) {
      const subject = await AdminSubject.create({
        name: s.name,
        code: s.code,
        semester: s.semester,
        color: s.color,
        description: s.description,
        topics: s.topics.map((title, i) => ({ title, order: i })),
      });
      console.log(`  ✓ ${subject.name} — ${subject.topics.length} topics`);
    }

    // 2. Push Schedule to All Users
    console.log("\n📅 Seeding schedule...");
    const users = await User.find({});
    if (users.length === 0) {
      console.log(
        "  ⚠️  No users found — register users first, then run this script again",
      );
    } else {
      await Schedule.deleteMany({});
      const schedule = generateSchedule();
      const scheduleDocs = [];
      for (const u of users) {
        for (const s of schedule) {
          scheduleDocs.push({ ...s, user: u._id });
        }
      }
      await Schedule.insertMany(scheduleDocs);
      console.log(
        `  ✓ ${schedule.length} schedule entries pushed to ${users.length} users`,
      );
      schedule.forEach((s) =>
        console.log(
          `    ${s.day} ${s.startTime}-${s.endTime}: ${s.subject} (${s.type})`,
        ),
      );
    }

    // 3. Push Assignments to All Users
    console.log("\n📝 Seeding assignments...");
    if (users.length > 0) {
      const { Assignment } = require("../models/index");
      await Assignment.deleteMany({});
      const assignments = generateAssignments();
      const assignmentDocs = [];
      for (const u of users) {
        for (const a of assignments) {
          assignmentDocs.push({ ...a, user: u._id });
        }
      }
      await Assignment.insertMany(assignmentDocs);
      console.log(
        `  ✓ ${assignments.length} assignments pushed to ${users.length} users`,
      );
      assignments.forEach((a) => {
        const days = Math.round(
          (a.dueDate - Date.now()) / (24 * 60 * 60 * 1000),
        );
        console.log(
          `    [${a.priority.toUpperCase()}] ${a.subject}: ${a.title} — due in ${days} days`,
        );
      });
    }

    console.log("\n🎉 College data seed complete!");
    console.log("\n📖 HINDI/NEPALI RESOURCES (copy to your browser):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("MIS & E-Business:");
    console.log(
      "  Hindi: https://www.youtube.com/@GateSmashers (MIS playlist)",
    );
    console.log("  Hindi: https://www.youtube.com/@KnowledgeGate (E-Commerce)");
    console.log("DotNet / C#:");
    console.log(
      "  Hindi: https://www.youtube.com/@CodeWithHarry (C# playlist)",
    );
    console.log(
      "  Hindi: https://www.youtube.com/@ShriHariYouTube (C# in Hindi)",
    );
    console.log("Computer Networking:");
    console.log("  Hindi: https://www.youtube.com/@GateSmashers (CN playlist)");
    console.log(
      "  English: https://www.youtube.com/@NesoacademyNet (Neso Academy)",
    );
    console.log("  English: https://www.youtube.com/@JennyslecturesCSITNotes");
    console.log("Management:");
    console.log("  Hindi: https://www.youtube.com/@CommerceWallahbyPW");
    console.log("  Hindi: https://www.youtube.com/@StudyWithShivam");
    console.log("Computer Graphics:");
    console.log("  Hindi: https://www.youtube.com/@GateSmashers (CG playlist)");
    console.log("  English: https://www.youtube.com/@JennyslecturesCSITNotes");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
