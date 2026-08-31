require('dotenv').config();
const mongoose = require('mongoose');
const { AdminSubject } = require('../models/adminModels');

// ─────────────────────────────────────────────────────────────────────────────
// TU BCA 6th Semester — Curated Hindi & English Study Resources
// Run: npm run seed:resources
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCES_BY_SUBJECT = {
  'Mobile Programming': [
    // Hindi YouTube
    { name: 'Smartherd — Complete Android Development with Java (Hindi) ⭐', url: 'https://www.youtube.com/@Smartherd', resourceType: 'video', language: 'Hindi' },
    { name: 'Cheezy Code — Android App Development Tutorial (Hindi) ⭐', url: 'https://www.youtube.com/@CheezyCode', resourceType: 'video', language: 'Hindi' },
    { name: 'Anuj Bhaiya — Android Development with Kotlin / Java (Hindi)', url: 'https://www.youtube.com/@AnujBhaiya', resourceType: 'video', language: 'Hindi' },
    // English YouTube & Documentation
    { name: 'Philipp Lackner — Modern Android Development (English) ⭐', url: 'https://www.youtube.com/@PhilippLackner', resourceType: 'video', language: 'English' },
    { name: 'Android Developers — Official Android Documentation & Codelabs', url: 'https://developer.android.com/courses', resourceType: 'website', language: 'English' },
    { name: 'Hacking with Swift — 100 Days of Swift & SwiftUI (iOS)', url: 'https://www.hackingwithswift.com/100', resourceType: 'notes', language: 'English' },
    { name: 'GeeksforGeeks — Android SQLite CRUD Complete Guide', url: 'https://www.geeksforgeeks.org/android-sqlite-database-in-java-with-example', resourceType: 'notes', language: 'English' },
  ],

  'Distributed Systems': [
    // Hindi YouTube
    { name: 'Gate Smashers — Complete Distributed Systems Series (Hindi) ⭐', url: 'https://www.youtube.com/@GateSmashers', resourceType: 'video', language: 'Hindi' },
    { name: 'Knowledge Gate — Distributed Computing & Algorithms (Hindi)', url: 'https://www.youtube.com/@KnowledgeGate', resourceType: 'video', language: 'Hindi' },
    { name: 'Last Moment Tuitions — Distributed Systems Exam Prep (Hindi)', url: 'https://www.youtube.com/@LastMomentTuitions', resourceType: 'video', language: 'Hindi' },
    // English
    { name: 'Martin Kleppmann (Cambridge) — Distributed Systems Lectures ⭐', url: 'https://www.youtube.com/playlist?list=PLeKd45zvjcDFUEv_ohr_HdUFeocUXPJg8', resourceType: 'video', language: 'English' },
    { name: 'GeeksforGeeks — Distributed Systems Notes & Lamport Clocks', url: 'https://www.geeksforgeeks.org/distributed-systems-tutorial', resourceType: 'notes', language: 'English' },
    { name: 'Distributed Systems 3rd Edition (Tanenbaum & Van Steen) Free PDF Notes', url: 'https://www.distributed-systems.net/index.php/books/ds3', resourceType: 'book', language: 'English' },
  ],

  'Applied Economics': [
    // Hindi YouTube
    { name: 'Commerce Wallah by PW — Elasticity, Costs & Market Structures (Hindi) ⭐', url: 'https://www.youtube.com/@CommerceWallahbyPW', resourceType: 'video', language: 'Hindi' },
    { name: 'CA Parag Gupta — Microeconomics & National Income Easy Hindi', url: 'https://www.youtube.com/@CAParagGupta', resourceType: 'video', language: 'Hindi' },
    { name: 'Study With Shivam — Managerial & Applied Economics (Hindi)', url: 'https://www.youtube.com/@StudyWithShivam', resourceType: 'video', language: 'Hindi' },
    // Nepal Context & English
    { name: 'Nepal Rastra Bank (NRB) — Official Monetary Policy & Economic Reports', url: 'https://www.nrb.org.np', resourceType: 'website', language: 'Nepali' },
    { name: 'Khan Academy — Microeconomics & Macroeconomics Courses ⭐', url: 'https://www.khanacademy.org/economics-finance-domain/microeconomics', resourceType: 'website', language: 'English' },
    { name: 'Investopedia — Elasticity, Consumer Surplus & Market Equilibrium', url: 'https://www.investopedia.com/terms/e/elasticity.asp', resourceType: 'notes', language: 'English' },
  ],

  'Advanced Java Programming': [
    // Hindi YouTube
    { name: 'Telusko — Java Servlets & JSP Full Course (Hindi) ⭐', url: 'https://www.youtube.com/@Telusko', resourceType: 'video', language: 'Hindi' },
    { name: 'CodeWithHarry — Java Swing & JDBC Complete Playlist (Hindi)', url: 'https://www.youtube.com/@CodeWithHarry', resourceType: 'video', language: 'Hindi' },
    { name: 'Durga Software Solutions — Advanced Java (JDBC, Servlets, JSP)', url: 'https://www.youtube.com/@DurgaSoftwareSolutions', resourceType: 'video', language: 'Hindi' },
    // English & Practice
    { name: 'Amigoscode — Modern Java & Web Applications (English) ⭐', url: 'https://www.youtube.com/@amigoscode', resourceType: 'video', language: 'English' },
    { name: 'Baeldung — In-depth JDBC, Servlets, and Session Management Guides', url: 'https://www.baeldung.com/category/java', resourceType: 'notes', language: 'English' },
    { name: 'JavaTpoint — Complete Advanced Java & RMI Tutorial', url: 'https://www.javatpoint.com/servlet-tutorial', resourceType: 'notes', language: 'English' },
    { name: 'Oracle Java Documentation — Swing & JDBC Official API Docs', url: 'https://docs.oracle.com/javase/tutorial', resourceType: 'website', language: 'English' },
  ],

  'Network Programming': [
    // Hindi YouTube
    { name: 'Gate Smashers — Complete Computer Networks & Protocols (Hindi) ⭐', url: 'https://www.youtube.com/@GateSmashers', resourceType: 'video', language: 'Hindi' },
    { name: 'Knowledge Gate — Socket Programming & OSI Layers (Hindi)', url: 'https://www.youtube.com/@KnowledgeGate', resourceType: 'video', language: 'Hindi' },
    { name: '5 Minutes Engineering — Network Programming & TCP/IP Sockets', url: 'https://www.youtube.com/@5MinutesEngineering', resourceType: 'video', language: 'Hindi' },
    // English
    { name: "Jenny's Lectures — Sockets, TCP, UDP & Multicasting (English) ⭐", url: 'https://www.youtube.com/@JennyslecturesCSITNotes', resourceType: 'video', language: 'English' },
    { name: 'Neso Academy — Computer Networks Complete Series', url: 'https://www.youtube.com/@nesoacademy', resourceType: 'video', language: 'English' },
    { name: 'Elliotte Rusty Harold — Java Network Programming O’Reilly Guide', url: 'https://www.oreilly.com/library/view/java-network-programming/9781449365936', resourceType: 'book', language: 'English' },
    { name: 'GeeksforGeeks — Java Socket Programming & Non-blocking NIO Tutorial', url: 'https://www.geeksforgeeks.org/socket-programming-in-java', resourceType: 'practice', language: 'English' },
  ],

  'Project II': [
    // Resources & Guides
    { name: 'Git & GitHub Complete Crash Course for Beginners (Hindi) ⭐', url: 'https://www.youtube.com/watch?v=gwWKnnCMQ5c', resourceType: 'video', language: 'Hindi' },
    { name: 'Overleaf LaTeX — TU / IEEE Standard Project Report Template', url: 'https://www.overleaf.com/gallery/tagged/ieee-official', resourceType: 'practice', language: 'English' },
    { name: 'GitHub Student Developer Pack & Tools', url: 'https://education.github.com/pack', resourceType: 'website', language: 'English' },
    { name: 'Draw.io / Diagrams.net — Free UML, ERD & System Architecture Designer', url: 'https://app.diagrams.net', resourceType: 'practice', language: 'English' },
    { name: 'Postman — API Testing and Documentation Tool', url: 'https://www.postman.com', resourceType: 'practice', language: 'English' },
  ],
};

const seedResources = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let totalResources = 0;
    for (const [subjectName, resources] of Object.entries(RESOURCES_BY_SUBJECT)) {
      const subject = await AdminSubject.findOne({ name: subjectName });
      if (subject) {
        subject.resources = resources;
        await subject.save();
        totalResources += resources.length;
        console.log(`   🔗 Added ${resources.length} resources for ${subjectName}`);
      } else {
        console.log(`   ⚠️ Subject not found: ${subjectName}`);
      }
    }

    console.log(`\n🎉 Seed complete! Added ${totalResources} study resources across 6th semester subjects.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Resource seed failed:', err.message);
    process.exit(1);
  }
};

seedResources();
