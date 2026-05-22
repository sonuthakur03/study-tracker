require('dotenv').config();
const mongoose = require('mongoose');
const { DSAQuestion, RoadmapTopic } = require('../models/index');
const User = require('../models/User');

const DSA_QUESTIONS = [
  { title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays & Hashing', platform: 'LeetCode', dayNumber: 1, resourceUrl: 'https://leetcode.com/problems/two-sum/', description: 'Given an array of integers and a target, return indices of two numbers that add up to target.' },
  { title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stack', platform: 'LeetCode', dayNumber: 2, resourceUrl: 'https://leetcode.com/problems/valid-parentheses/', description: 'Determine if the input string has valid brackets.' },
  { title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', topic: 'Sliding Window', platform: 'LeetCode', dayNumber: 3, resourceUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { title: 'Reverse a Linked List', difficulty: 'Easy', topic: 'Linked List', platform: 'LeetCode', dayNumber: 4, resourceUrl: 'https://leetcode.com/problems/reverse-linked-list/' },
  { title: 'Binary Search', difficulty: 'Easy', topic: 'Binary Search', platform: 'LeetCode', dayNumber: 5, resourceUrl: 'https://leetcode.com/problems/binary-search/' },
  { title: 'Climbing Stairs', difficulty: 'Easy', topic: 'Dynamic Programming', platform: 'LeetCode', dayNumber: 6, resourceUrl: 'https://leetcode.com/problems/climbing-stairs/', description: 'Classic intro to DP — think Fibonacci.' },
  { title: "Maximum Subarray (Kadane's Algorithm)", difficulty: 'Medium', topic: 'Dynamic Programming', platform: 'LeetCode', dayNumber: 7, resourceUrl: 'https://leetcode.com/problems/maximum-subarray/' },
  { title: 'Merge Intervals', difficulty: 'Medium', topic: 'Arrays & Sorting', platform: 'LeetCode', dayNumber: 8, resourceUrl: 'https://leetcode.com/problems/merge-intervals/' },
  { title: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs & BFS/DFS', platform: 'LeetCode', dayNumber: 9, resourceUrl: 'https://leetcode.com/problems/number-of-islands/' },
  { title: 'Longest Common Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', platform: 'LeetCode', dayNumber: 10, resourceUrl: 'https://leetcode.com/problems/longest-common-subsequence/' },
  { title: 'Product of Array Except Self', difficulty: 'Medium', topic: 'Arrays', platform: 'LeetCode', dayNumber: 11, resourceUrl: 'https://leetcode.com/problems/product-of-array-except-self/' },
  { title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', platform: 'LeetCode', dayNumber: 12, resourceUrl: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/' },
  { title: 'Level Order Traversal (BFS)', difficulty: 'Medium', topic: 'Trees & BFS', platform: 'LeetCode', dayNumber: 13, resourceUrl: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
  { title: 'Course Schedule (Topological Sort)', difficulty: 'Medium', topic: 'Graphs', platform: 'LeetCode', dayNumber: 14, resourceUrl: 'https://leetcode.com/problems/course-schedule/' },
  { title: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'DP & Strings', platform: 'LeetCode', dayNumber: 15, resourceUrl: 'https://leetcode.com/problems/longest-palindromic-substring/' },
  { title: 'Word Search', difficulty: 'Medium', topic: 'Backtracking', platform: 'LeetCode', dayNumber: 16, resourceUrl: 'https://leetcode.com/problems/word-search/' },
  { title: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Heap & Linked List', platform: 'LeetCode', dayNumber: 17, resourceUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
  { title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Two Pointers / Stack', platform: 'LeetCode', dayNumber: 18, resourceUrl: 'https://leetcode.com/problems/trapping-rain-water/' },
  { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Binary Search', platform: 'LeetCode', dayNumber: 19, resourceUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },
  { title: 'N-Queens', difficulty: 'Hard', topic: 'Backtracking', platform: 'LeetCode', dayNumber: 20, resourceUrl: 'https://leetcode.com/problems/n-queens/' },
];

// NOTE: 'resourceType' is used instead of 'type' because 'type' is
//       a reserved Mongoose keyword inside schema subdocuments.
const ROADMAP_TOPICS = [
  // ── AI/ML Path ──────────────────────────────────────────────────────────
  {
    path: 'aiml', phase: 1, phaseTitle: 'Python Fundamentals',
    title: 'Variables, Data Types & Control Flow', order: 1, weekTarget: 'Weeks 1-2',
    resources: [{ name: 'CS50P Harvard Python', url: 'https://cs50.harvard.edu/python', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 1, phaseTitle: 'Python Fundamentals',
    title: 'Functions, Modules & OOP Basics', order: 2, weekTarget: 'Weeks 2-3',
    resources: [{ name: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com', resourceType: 'book' }],
  },
  {
    path: 'aiml', phase: 1, phaseTitle: 'Python Fundamentals',
    title: 'File I/O, Error Handling & Working with APIs', order: 3, weekTarget: 'Weeks 4-6',
    resources: [{ name: 'freeCodeCamp Python Course', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', resourceType: 'video' }],
  },
  {
    path: 'aiml', phase: 2, phaseTitle: 'Math for ML',
    title: 'Linear Algebra — Vectors, Matrices, Operations', order: 1, weekTarget: 'Weeks 7-8',
    resources: [{ name: '3Blue1Brown Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', resourceType: 'video' }],
  },
  {
    path: 'aiml', phase: 2, phaseTitle: 'Math for ML',
    title: 'Statistics — Mean, Variance, Distributions, Probability', order: 2, weekTarget: 'Weeks 8-9',
    resources: [{ name: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 2, phaseTitle: 'Math for ML',
    title: 'Gradient Descent & Calculus Intuition', order: 3, weekTarget: 'Weeks 9-10',
    resources: [{ name: 'StatQuest with Josh Starmer', url: 'https://www.youtube.com/@statquest', resourceType: 'video' }],
  },
  {
    path: 'aiml', phase: 3, phaseTitle: 'Data Analysis',
    title: 'NumPy Arrays & Operations', order: 1, weekTarget: 'Weeks 11-12',
    resources: [{ name: 'NumPy Quickstart Official', url: 'https://numpy.org/doc/stable/user/quickstart.html', resourceType: 'docs' }],
  },
  {
    path: 'aiml', phase: 3, phaseTitle: 'Data Analysis',
    title: 'Pandas — Load, Clean, Filter, Aggregate', order: 2, weekTarget: 'Weeks 12-13',
    resources: [{ name: 'Kaggle Pandas Course (Free)', url: 'https://www.kaggle.com/learn/pandas', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 3, phaseTitle: 'Data Analysis',
    title: 'Matplotlib & Seaborn — EDA & Visualization', order: 3, weekTarget: 'Weeks 13-14',
    resources: [{ name: 'Kaggle Data Visualization (Free)', url: 'https://www.kaggle.com/learn/data-visualization', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 4, phaseTitle: 'ML Foundations',
    title: 'Linear & Logistic Regression', order: 1, weekTarget: 'Weeks 15-17',
    resources: [{ name: 'Andrew Ng ML Specialization (Audit Free)', url: 'https://www.coursera.org/specializations/machine-learning-introduction', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 4, phaseTitle: 'ML Foundations',
    title: 'Decision Trees, Random Forests, SVM, KNN', order: 2, weekTarget: 'Weeks 17-19',
    resources: [{ name: 'Kaggle Intro to ML (Free)', url: 'https://www.kaggle.com/learn/intro-to-machine-learning', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 4, phaseTitle: 'ML Foundations',
    title: 'Model Evaluation — Cross Validation, Precision, Recall, F1', order: 3, weekTarget: 'Weeks 19-22',
    resources: [{ name: 'scikit-learn Getting Started', url: 'https://scikit-learn.org/stable/getting_started.html', resourceType: 'docs' }],
  },
  {
    path: 'aiml', phase: 5, phaseTitle: 'Deep Learning',
    title: 'Neural Networks — Architecture & Backpropagation', order: 1, weekTarget: 'Weeks 23-25',
    resources: [{ name: '3Blue1Brown Neural Networks', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', resourceType: 'video' }],
  },
  {
    path: 'aiml', phase: 5, phaseTitle: 'Deep Learning',
    title: 'CNNs, RNNs & Transfer Learning with PyTorch', order: 2, weekTarget: 'Weeks 25-28',
    resources: [{ name: 'fast.ai Practical Deep Learning (Free)', url: 'https://course.fast.ai', resourceType: 'course' }],
  },
  {
    path: 'aiml', phase: 5, phaseTitle: 'Deep Learning',
    title: 'Transformers & Attention Mechanism (Intro)', order: 3, weekTarget: 'Weeks 28-30',
    resources: [{ name: 'Andrej Karpathy YouTube', url: 'https://www.youtube.com/@AndrejKarpathy', resourceType: 'video' }],
  },
  {
    path: 'aiml', phase: 6, phaseTitle: 'Projects & Career',
    title: 'Kaggle Competition + End-to-End ML Project', order: 1, weekTarget: 'Weeks 31+',
    resources: [{ name: 'Kaggle Competitions (Free)', url: 'https://www.kaggle.com/competitions', resourceType: 'practice' }],
  },
  {
    path: 'aiml', phase: 6, phaseTitle: 'Projects & Career',
    title: 'GitHub Portfolio, README & ML Interview Prep', order: 2, weekTarget: 'Weeks 31+',
    resources: [{ name: 'Papers With Code (Free)', url: 'https://paperswithcode.com', resourceType: 'research' }],
  },

  // ── Data Engineering Path ────────────────────────────────────────────────
  {
    path: 'de', phase: 1, phaseTitle: 'Python Fundamentals',
    title: 'Python Basics + File Handling + APIs', order: 1, weekTarget: 'Weeks 1-6',
    resources: [{ name: 'CS50P Harvard Python (Free)', url: 'https://cs50.harvard.edu/python', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 2, phaseTitle: 'SQL & Databases',
    title: 'SQL Fundamentals — Joins, Aggregations, CTEs', order: 1, weekTarget: 'Weeks 7-9',
    resources: [{ name: 'SQLZoo Interactive SQL (Free)', url: 'https://sqlzoo.net', resourceType: 'practice' }],
  },
  {
    path: 'de', phase: 2, phaseTitle: 'SQL & Databases',
    title: 'Window Functions, Indexes & Query Optimization', order: 2, weekTarget: 'Weeks 9-11',
    resources: [{ name: 'Mode Analytics SQL Tutorial (Free)', url: 'https://mode.com/sql-tutorial', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 3, phaseTitle: 'Data Modeling',
    title: 'Star Schema, Fact & Dimension Tables, ETL vs ELT', order: 1, weekTarget: 'Weeks 12-13',
    resources: [{ name: 'dbt Learn Official Courses (Free)', url: 'https://courses.getdbt.com', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 3, phaseTitle: 'Data Modeling',
    title: 'Data Warehouse Design & OLAP Concepts', order: 2, weekTarget: 'Weeks 13-15',
    resources: [{ name: 'DataTalks.Club DE Zoomcamp (Free)', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 4, phaseTitle: 'Big Data Tools',
    title: 'Apache Spark & PySpark — DataFrames & Transformations', order: 1, weekTarget: 'Weeks 16-19',
    resources: [{ name: 'Databricks Free Training (Spark)', url: 'https://www.databricks.com/learn/training/home', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 4, phaseTitle: 'Big Data Tools',
    title: 'Apache Kafka — Streaming Data Basics', order: 2, weekTarget: 'Weeks 19-23',
    resources: [{ name: 'Confluent Kafka Tutorials (Free)', url: 'https://developer.confluent.io/tutorials', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 5, phaseTitle: 'Cloud & Orchestration',
    title: 'Apache Airflow — DAGs, Operators & Scheduling', order: 1, weekTarget: 'Weeks 24-27',
    resources: [{ name: 'Astronomer Academy Airflow (Free)', url: 'https://academy.astronomer.io', resourceType: 'course' }],
  },
  {
    path: 'de', phase: 5, phaseTitle: 'Cloud & Orchestration',
    title: 'Docker + GCP BigQuery (Free Tier) + AWS S3 Basics', order: 2, weekTarget: 'Weeks 27-30',
    resources: [{ name: 'GCP BigQuery Free Sandbox', url: 'https://cloud.google.com/bigquery/docs/sandbox', resourceType: 'tool' }],
  },
  {
    path: 'de', phase: 6, phaseTitle: 'Projects & Career',
    title: 'End-to-End Pipeline Project + GitHub Portfolio', order: 1, weekTarget: 'Weeks 31+',
    resources: [{ name: 'DataTalks.Club DE Zoomcamp (Best Free Resource)', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', resourceType: 'course' }],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await DSAQuestion.deleteMany({});
    await RoadmapTopic.deleteMany({});
    console.log('🗑️  Cleared existing DSA & Roadmap data');

    await DSAQuestion.insertMany(DSA_QUESTIONS);
    console.log(`✅ Seeded ${DSA_QUESTIONS.length} DSA questions`);

    await RoadmapTopic.insertMany(ROADMAP_TOPICS);
    console.log(`✅ Seeded ${ROADMAP_TOPICS.length} roadmap topics`);

    // Create admin user if not exists
    if (process.env.ADMIN_EMAIL) {
      const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminExists) {
        await User.create({
          name: 'Admin',
          email: process.env.ADMIN_EMAIL,
          password: 'Admin@12345',
          role: 'admin',
        });
        console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL} / Admin@12345`);
        console.log('   ⚠️  Change this password immediately after first login!');
      } else {
        console.log(`ℹ️  Admin already exists: ${process.env.ADMIN_EMAIL}`);
      }
    } else {
      console.log('⚠️  ADMIN_EMAIL not set in .env — skipping admin creation');
    }

    console.log('\n🎉 Seed complete! Run: npm run dev');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
