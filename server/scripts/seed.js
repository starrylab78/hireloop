import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import Subscription from '../src/models/Subscription.js';
import { sanitizeJobDescription, htmlToPlainText } from '../src/services/sanitize.js';
import { computeMatchScore } from '../src/services/resumeParser.js';
import { recomputeTermVectors } from '../src/controllers/jobController.js';

const JOB_DESCRIPTIONS = {
  frontend: `<p>We're looking for a <strong>Frontend Engineer</strong> to build delightful, fast interfaces.</p>
  <ul><li>3+ years experience with React and TypeScript</li><li>Strong CSS/Tailwind skills</li><li>Experience with testing (Jest, Cypress)</li></ul>`,
  backend: `<p>Join us as a <strong>Backend Engineer</strong> building scalable APIs.</p>
  <ul><li>Node.js, Express, MongoDB experience</li><li>Familiarity with microservices and CI/CD</li><li>5+ years of experience preferred</li></ul>`,
  product: `<p>We need a <strong>Product Manager</strong> to own our hiring roadmap.</p>
  <ul><li>Experience with agile/scrum</li><li>Strong communication and leadership skills</li><li>Figma and UI/UX familiarity a plus</li></ul>`,
  data: `<p><strong>Data Scientist</strong> role focused on hiring analytics and matching models.</p>
  <ul><li>Python, SQL, machine learning experience</li><li>2+ years experience in data science</li></ul>`,
};

async function run() {
  await connectDB();
  console.log('[seed] clearing existing demo data...');
  await Promise.all([
    User.deleteMany({ email: /@hireloop-demo\.test$/ }),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Subscription.deleteMany({}),
  ]);

  const passwordHash = await User.hashPassword('Password123!');

  const [freeRecruiter, growthRecruiter, scaleRecruiter] = await User.create([
    {
      name: 'Asha Patil',
      email: 'free-recruiter@hireloop-demo.test',
      passwordHash,
      role: 'recruiter',
      companyName: 'Nimbus Studio',
      companyWebsite: 'https://nimbus-studio.example.com',
      companySlug: 'nimbus-studio',
      companyDescription: 'A small product studio building tools for independent designers.',
      plan: 'free',
    },
    {
      name: 'Rohan Mehta',
      email: 'growth-recruiter@hireloop-demo.test',
      passwordHash,
      role: 'recruiter',
      companyName: 'Vertex Labs',
      companyWebsite: 'https://vertexlabs.example.com',
      companySlug: 'vertex-labs',
      companyDescription: 'Backend infrastructure and developer tooling, remote-first team.',
      plan: 'growth',
    },
    {
      name: 'Priya Nair',
      email: 'scale-recruiter@hireloop-demo.test',
      passwordHash,
      role: 'recruiter',
      companyName: 'Northstar Robotics',
      companyWebsite: 'https://northstar.example.com',
      companySlug: 'northstar-robotics',
      companyDescription: 'Autonomous warehouse robotics, hiring across engineering and data science.',
      plan: 'scale',
    },
  ]);

  await Subscription.create([
    { recruiter: freeRecruiter._id, razorpayCustomerId: 'cust_demo_free', plan: 'free', status: 'none' },
    { recruiter: growthRecruiter._id, razorpayCustomerId: 'cust_demo_growth', razorpaySubscriptionId: 'sub_demo_growth', plan: 'growth', status: 'active', currentPeriodEnd: new Date(Date.now() + 20 * 86400000) },
    { recruiter: scaleRecruiter._id, razorpayCustomerId: 'cust_demo_scale', razorpaySubscriptionId: 'sub_demo_scale', plan: 'scale', status: 'active', currentPeriodEnd: new Date(Date.now() + 25 * 86400000) },
  ]);

  const candidates = await User.create([
    {
      name: 'Meera Iyer',
      email: 'meera@hireloop-demo.test',
      passwordHash,
      role: 'candidate',
      candidateProfile: {
        headline: 'Frontend Engineer',
        skills: ['react', 'typescript', 'tailwind', 'testing'],
        experienceYears: 4,
        location: 'Bengaluru, IN',
        resumeText: 'Meera Iyer. 4 years experience. Skilled in React, TypeScript, Tailwind, Jest testing, and CSS.',
      },
    },
    {
      name: 'Karan Shah',
      email: 'karan@hireloop-demo.test',
      passwordHash,
      role: 'candidate',
      candidateProfile: {
        headline: 'Backend Engineer',
        skills: ['node.js', 'mongodb', 'express', 'microservices'],
        experienceYears: 6,
        location: 'Pune, IN',
        resumeText: 'Karan Shah. 6 years experience. Node.js, Express, MongoDB, microservices, CI/CD.',
      },
    },
    {
      name: 'Divya Reddy',
      email: 'divya@hireloop-demo.test',
      passwordHash,
      role: 'candidate',
      candidateProfile: {
        headline: 'Product Manager',
        skills: ['agile', 'scrum', 'leadership', 'figma', 'ui/ux'],
        experienceYears: 5,
        location: 'Hyderabad, IN',
        resumeText: 'Divya Reddy. 5 years experience. Agile, scrum, leadership, Figma, UI/UX, product management.',
      },
    },
  ]);

  function buildJob({ recruiter, title, companyName, key, location, workMode, experienceLevel, salaryMin, salaryMax, skills, priorityListing }) {
    const descriptionHtml = sanitizeJobDescription(JOB_DESCRIPTIONS[key]);
    return {
      recruiter: recruiter._id,
      title,
      companyName,
      descriptionHtml,
      descriptionText: htmlToPlainText(descriptionHtml),
      location,
      workMode,
      experienceLevel,
      employmentType: 'full-time',
      salaryMin,
      salaryMax,
      currency: 'INR',
      skills,
      status: 'active',
      priorityListing: !!priorityListing,
    };
  }

  const jobs = await Job.create([
    buildJob({ recruiter: freeRecruiter, title: 'Frontend Engineer', companyName: 'Nimbus Studio', key: 'frontend', location: 'Bengaluru, IN', workMode: 'hybrid', experienceLevel: 'mid', salaryMin: 1200000, salaryMax: 1800000, skills: ['react', 'typescript', 'tailwind'] }),
    buildJob({ recruiter: growthRecruiter, title: 'Backend Engineer', companyName: 'Vertex Labs', key: 'backend', location: 'Pune, IN', workMode: 'remote', experienceLevel: 'senior', salaryMin: 1800000, salaryMax: 2600000, skills: ['node.js', 'mongodb', 'express'] }),
    buildJob({ recruiter: growthRecruiter, title: 'Product Manager', companyName: 'Vertex Labs', key: 'product', location: 'Pune, IN', workMode: 'hybrid', experienceLevel: 'mid', salaryMin: 1500000, salaryMax: 2200000, skills: ['agile', 'scrum', 'leadership'] }),
    buildJob({ recruiter: scaleRecruiter, title: 'Senior Data Scientist', companyName: 'Northstar Robotics', key: 'data', location: 'Remote', workMode: 'remote', experienceLevel: 'senior', salaryMin: 2200000, salaryMax: 3200000, skills: ['python', 'sql', 'machine learning'], priorityListing: true }),
    buildJob({ recruiter: scaleRecruiter, title: 'Backend Engineer (Robotics Platform)', companyName: 'Northstar Robotics', key: 'backend', location: 'Bengaluru, IN', workMode: 'onsite', experienceLevel: 'lead', salaryMin: 2800000, salaryMax: 4000000, skills: ['node.js', 'microservices', 'aws'], priorityListing: true }),
  ]);

  await recomputeTermVectors();

  // Sample applications wired to the backend jobs for the ATS demo.
  const backendJob = jobs[1];
  const app1 = await Application.create({
    job: backendJob._id,
    candidate: candidates[1]._id,
    recruiter: backendJob.recruiter,
    resumeUrl: '/uploads/demo-karan-resume.txt',
    resumeText: candidates[1].candidateProfile.resumeText,
    matchScore: computeMatchScore(candidates[1].candidateProfile.resumeText, backendJob.descriptionText),
    stage: 'screened',
    stageHistory: [{ stage: 'applied' }, { stage: 'screened' }],
  });
  backendJob.applicationsCount += 1;
  backendJob.views += 8;
  await backendJob.save();

  const frontendJob = jobs[0];
  await Application.create({
    job: frontendJob._id,
    candidate: candidates[0]._id,
    recruiter: frontendJob.recruiter,
    resumeUrl: '/uploads/demo-meera-resume.txt',
    resumeText: candidates[0].candidateProfile.resumeText,
    matchScore: computeMatchScore(candidates[0].candidateProfile.resumeText, frontendJob.descriptionText),
    stage: 'applied',
    stageHistory: [{ stage: 'applied' }],
  });
  frontendJob.applicationsCount += 1;
  frontendJob.views += 5;
  await frontendJob.save();

  console.log('[seed] done.');
  console.log(`
Demo accounts (password: Password123!):
  Free recruiter:   free-recruiter@hireloop-demo.test
  Growth recruiter: growth-recruiter@hireloop-demo.test
  Scale recruiter:  scale-recruiter@hireloop-demo.test
  Candidate:        meera@hireloop-demo.test / karan@hireloop-demo.test / divya@hireloop-demo.test
`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
