require('dotenv').config();
const mongoose = require('mongoose');
const { AdminSubject } = require('../models/adminModels');

// ─────────────────────────────────────────────────────────────────────────────
// BCA 5th Semester — Hindi & Nepali Study Resources
// Based on verified resource guide
// Run: npm run seed:resources
// ─────────────────────────────────────────────────────────────────────────────

const RESOURCES_BY_SUBJECT = {
  'MIS and E-Business': [
    // Hindi YouTube
    { name: 'Last Moment Tuitions — MIS & Exam Prep (Hindi) ⭐', url: 'https://www.youtube.com/@LastMomentTuitions',        resourceType: 'video',    language: 'Hindi'   },
    { name: 'Gate Smashers — E-Commerce & DB Foundations (Hindi)',url: 'https://www.youtube.com/@GateSmashers',              resourceType: 'video',    language: 'Hindi'   },
    { name: 'Education4u — MIS Structured Lectures (Hindi)',       url: 'https://www.youtube.com/results?search_query=Education4u+MIS', resourceType: 'video', language: 'Hindi' },
    // Notes / Websites
    { name: 'GeeksForGeeks — MIS Complete Notes',                  url: 'https://www.geeksforgeeks.org/management-information-system-mis', resourceType: 'notes', language: 'English' },
    { name: 'TutorialsPoint — E-Commerce Guide',                   url: 'https://www.tutorialspoint.com/e_commerce/index.htm',            resourceType: 'notes', language: 'English' },
    { name: 'Investopedia — E-Commerce Concepts',                  url: 'https://www.investopedia.com/terms/e/ecommerce.asp',             resourceType: 'notes', language: 'English' },
    // Nepal Context
    { name: 'eSewa — Nepali E-Payment Example (B2C)',              url: 'https://esewa.com.np',                               resourceType: 'website',  language: 'Nepali'  },
    { name: 'Daraz Nepal — B2C E-Commerce Example',                url: 'https://daraz.com.np',                               resourceType: 'website',  language: 'Nepali'  },
    { name: 'Hamrobazar — C2C E-Commerce Example',                 url: 'https://hamrobazar.com',                             resourceType: 'website',  language: 'Nepali'  },
    { name: 'ConnectIPS — Interbank Digital Payment Example',      url: 'https://connectips.com',                             resourceType: 'website',  language: 'Nepali'  },
  ],

  'DotNet Technology': [
    // Hindi YouTube
    { name: 'CodeWithHarry — C# Full Course Hindi ⭐',             url: 'https://www.youtube.com/@CodeWithHarry',             resourceType: 'video',    language: 'Hindi'   },
    { name: 'Easy Engineering Classes — C# for Beginners (Hindi)', url: 'https://www.youtube.com/@EasyEngineeringClasses',    resourceType: 'video',    language: 'Hindi'   },
    { name: 'Durga Software Solutions — C# & .NET (Hindi)',        url: 'https://www.youtube.com/@DurgaSoftwareSolutions',    resourceType: 'video',    language: 'Hindi'   },
    // English
    { name: 'Mosh Hamedani — C# for Beginners ⭐',                 url: 'https://www.youtube.com/@programmingwithmosh',       resourceType: 'video',    language: 'English' },
    { name: 'IAmTimCorey — ASP.NET & C# Real Projects',           url: 'https://www.youtube.com/@IAmTimCorey',               resourceType: 'video',    language: 'English' },
    { name: 'kudvenkat — ASP.NET MVC Tutorials',                   url: 'https://www.youtube.com/@kudvenkat',                 resourceType: 'video',    language: 'English' },
    // Practice Tools
    { name: 'DotNetFiddle — Run C# Code Online (No Install)',      url: 'https://dotnetfiddle.net',                           resourceType: 'practice', language: 'English' },
    { name: 'W3Schools — C# Quick Reference',                      url: 'https://www.w3schools.com/cs',                       resourceType: 'notes',    language: 'English' },
  ],

  'Computer Networking': [
    // Hindi YouTube
    { name: 'Gate Smashers — Complete CN Playlist ⭐ (OSI, TCP/IP, Routing)', url: 'https://www.youtube.com/@GateSmashers', resourceType: 'video', language: 'Hindi' },
    { name: 'Knowledge Gate — University-level Networking (Hindi)',            url: 'https://www.youtube.com/@KnowledgeGate',              resourceType: 'video',    language: 'Hindi'   },
    { name: '5 Minutes Engineering — Quick CN Concepts (Hindi)',               url: 'https://www.youtube.com/@5MinutesEngineering',        resourceType: 'video',    language: 'Hindi'   },
    // English
    { name: 'Neso Academy — Complete Computer Networks Series ⭐',             url: 'https://www.youtube.com/@nesoacademy',                resourceType: 'video',    language: 'English' },
    { name: "Jenny's Lectures — Networking & Protocols",                       url: 'https://www.youtube.com/@JennyslecturesCSITNotes',    resourceType: 'video',    language: 'English' },
    { name: 'Sunny Classroom — IP Addressing & Subnetting ⭐',                 url: 'https://www.youtube.com/@SunnyClassroom',             resourceType: 'video',    language: 'English' },
    // Practice
    { name: 'SubnettingPractice.com — Free Subnetting Drills',                 url: 'https://www.subnettingpractice.com',                  resourceType: 'practice', language: 'English' },
    { name: 'CIDR.xyz — Visual CIDR Calculator',                               url: 'https://cidr.xyz',                                    resourceType: 'practice', language: 'English' },
  ],

  'Introduction to Management': [
    // Hindi YouTube
    { name: 'Commerce Wallah by PW — Fayol & Taylor (Hindi) ⭐',  url: 'https://www.youtube.com/@CommerceWallahbyPW',        resourceType: 'video',    language: 'Hindi'   },
    { name: 'Letstute Accountancy — Business Management (Hindi)',  url: 'https://www.youtube.com/@Letstuteaccountancy',       resourceType: 'video',    language: 'Hindi'   },
    { name: 'Rajat Arora — Management Functions Easy Hindi',       url: 'https://www.youtube.com/@RajatArora',                resourceType: 'video',    language: 'Hindi'   },
  ],

  'Computer Graphics and Animation': [
    // Hindi YouTube
    { name: 'TutorialsSpace (Er. Deepak Garg) — Full CG Syllabus ⭐', url: 'https://www.youtube.com/@TutorialsSpace',         resourceType: 'video',    language: 'Hindi'   },
    { name: 'Easy Engineering Classes — DDA & Bresenham (Hindi)',      url: 'https://www.youtube.com/@EasyEngineeringClasses', resourceType: 'video',    language: 'Hindi'   },
    { name: '5 Minutes Engineering — CG Algorithms & Clipping (Hindi)',url: 'https://www.youtube.com/@5MinutesEngineering',    resourceType: 'video',    language: 'Hindi'   },
    // English
    { name: "Jenny's Lectures — DDA, Bresenham & Transformations",     url: 'https://www.youtube.com/@JennyslecturesCSITNotes', resourceType: 'video',   language: 'English' },
    { name: 'NPTEL IIT — Computer Graphics Full Course',               url: 'https://nptel.ac.in',                             resourceType: 'video',    language: 'English' },
  ],
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    let updated = 0, skipped = 0;

    for (const [subjectName, resources] of Object.entries(RESOURCES_BY_SUBJECT)) {
      // Find subject by name (case-insensitive)
      const subject = await AdminSubject.findOne({
        name: { $regex: new RegExp(subjectName, 'i') },
      });

      if (!subject) {
        console.log(`⚠️  Subject not found: "${subjectName}" — run npm run seed:college first`);
        skipped++;
        continue;
      }

      // Add only resources that don't already exist (match by URL)
      const existingUrls = (subject.resources || []).map(r => r.url);
      const newResources = resources.filter(r => !existingUrls.includes(r.url));

      if (newResources.length === 0) {
        console.log(`ℹ️  ${subjectName} — all resources already exist, skipping`);
        skipped++;
        continue;
      }

      await AdminSubject.findByIdAndUpdate(
        subject._id,
        { $push: { resources: { $each: newResources } } },
        { new: true }
      );

      console.log(`✅ ${subjectName} — added ${newResources.length} resources:`);
      newResources.forEach(r => console.log(`     ${r.language === 'Hindi' ? '🇮🇳' : r.language === 'Nepali' ? '🇳🇵' : '🇬🇧'} ${r.name}`));
      updated++;
    }

    console.log(`\n🎉 Done — ${updated} subjects updated, ${skipped} skipped`);
    console.log('\nUsers can now see these resources on the Subjects page under each subject.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
