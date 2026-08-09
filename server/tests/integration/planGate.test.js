import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { startTestDB, stopTestDB, clearTestDB } from '../setup.js';
import { createApp } from '../../src/app.js';
import User from '../../src/models/User.js';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

const app = createApp();

beforeAll(async () => { await startTestDB(); });
afterAll(async () => { await stopTestDB(); });
beforeEach(async () => { await clearTestDB(); });

async function registerRecruiter(agent, { email, plan = 'free' }) {
  await agent.post('/api/auth/register').send({
    name: 'Rec Ruiter',
    email,
    password: 'Password123!',
    role: 'recruiter',
    companyName: 'Test Co',
  });
  if (plan !== 'free') {
    await User.updateOne({ email }, { plan }); // simulate a completed Razorpay checkout
  }
}

function jobPayload(title = 'Engineer') {
  return {
    title,
    companyName: 'Test Co',
    descriptionHtml: '<p>We are hiring an engineer with strong fundamentals.</p>',
    location: 'Remote',
    workMode: 'remote',
    experienceLevel: 'mid',
    employmentType: 'full-time',
    skills: ['node.js'],
  };
}

describe('Plan gating: active job post limits', () => {
  it('Free plan blocks a 2nd active job post', async () => {
    const agent = request.agent(app);
    await registerRecruiter(agent, { email: 'free@test.dev', plan: 'free' });

    const first = await agent.post('/api/jobs').send(jobPayload('First role'));
    expect(first.status).toBe(201);

    const second = await agent.post('/api/jobs').send(jobPayload('Second role'));
    expect(second.status).toBe(402);
    expect(second.body.code).toBe('PLAN_JOB_LIMIT_REACHED');
  });

  it('Growth plan allows up to 10 active job posts', async () => {
    const agent = request.agent(app);
    await registerRecruiter(agent, { email: 'growth@test.dev', plan: 'growth' });

    for (let i = 0; i < 10; i++) {
      const res = await agent.post('/api/jobs').send(jobPayload(`Role ${i}`));
      expect(res.status).toBe(201);
    }
    const eleventh = await agent.post('/api/jobs').send(jobPayload('Role 11'));
    expect(eleventh.status).toBe(402);
  });

  it('Scale plan has no active job post limit', async () => {
    const agent = request.agent(app);
    await registerRecruiter(agent, { email: 'scale@test.dev', plan: 'scale' });

    for (let i = 0; i < 15; i++) {
      const res = await agent.post('/api/jobs').send(jobPayload(`Role ${i}`));
      expect(res.status).toBe(201);
    }
  });
});

describe('Plan gating: ATS pipeline and CSV export', () => {
  it('Free plan cannot move an applicant through pipeline stages', async () => {
    const recruiterAgent = request.agent(app);
    await registerRecruiter(recruiterAgent, { email: 'freeats@test.dev', plan: 'free' });
    const jobRes = await recruiterAgent.post('/api/jobs').send(jobPayload());
    const jobId = jobRes.body.job._id;

    const candidateAgent = request.agent(app);
    await candidateAgent.post('/api/auth/register').send({ name: 'Cand', email: 'cand1@test.dev', password: 'Password123!', role: 'candidate' });
    const applyRes = await candidateAgent
      .post(`/api/applications/jobs/${jobId}/apply`)
      .field('coverNote', 'hi')
      .attach('resume', Buffer.from('React Node experience'), { filename: 'resume.txt', contentType: 'text/plain' });
    expect(applyRes.status).toBe(201);
    const applicationId = applyRes.body.application._id;

    const stageRes = await recruiterAgent.patch(`/api/applications/${applicationId}/stage`).send({ stage: 'screened' });
    expect(stageRes.status).toBe(402);
    expect(stageRes.body.code).toBe('PLAN_FEATURE_LOCKED');
  });

  it('Growth plan CAN move an applicant through pipeline stages and export CSV', async () => {
    const recruiterAgent = request.agent(app);
    await registerRecruiter(recruiterAgent, { email: 'growthats@test.dev', plan: 'growth' });
    const jobRes = await recruiterAgent.post('/api/jobs').send(jobPayload());
    const jobId = jobRes.body.job._id;

    const candidateAgent = request.agent(app);
    await candidateAgent.post('/api/auth/register').send({ name: 'Cand', email: 'cand2@test.dev', password: 'Password123!', role: 'candidate' });
    const applyRes = await candidateAgent
      .post(`/api/applications/jobs/${jobId}/apply`)
      .attach('resume', Buffer.from('React Node experience'), { filename: 'resume.txt', contentType: 'text/plain' });
    const applicationId = applyRes.body.application._id;

    const stageRes = await recruiterAgent.patch(`/api/applications/${applicationId}/stage`).send({ stage: 'screened' });
    expect(stageRes.status).toBe(200);
    expect(stageRes.body.application.stage).toBe('screened');

    const csvRes = await recruiterAgent.get(`/api/applications/jobs/${jobId}/export`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
  });
});

describe('Cross-account isolation', () => {
  it("one recruiter cannot patch another recruiter's job", async () => {
    const recruiterA = request.agent(app);
    await registerRecruiter(recruiterA, { email: 'a@test.dev', plan: 'growth' });
    const jobRes = await recruiterA.post('/api/jobs').send(jobPayload());
    const jobId = jobRes.body.job._id;

    const recruiterB = request.agent(app);
    await registerRecruiter(recruiterB, { email: 'b@test.dev', plan: 'growth' });
    const patchRes = await recruiterB.patch(`/api/jobs/${jobId}`).send({ title: 'Hijacked title' });

    expect(patchRes.status).toBe(404); // scoped query returns nothing outside the owner's team
  });
});
