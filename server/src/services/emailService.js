import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'HireLoop <notifications@hireloop.dev>';

async function send(to, subject, html) {
  if (!resend) {
    console.log(`[email:dev-mode] to=${to} subject="${subject}" (set RESEND_API_KEY to actually send)`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('[email] send failed', err);
  }
}

export async function sendNewApplicantEmail(recruiter, job, candidate) {
  await send(
    recruiter.email,
    `New applicant for ${job.title}`,
    `<p>Hi ${recruiter.name},</p>
     <p><strong>${candidate.name}</strong> just applied to <strong>${job.title}</strong>.</p>
     <p><a href="${process.env.CLIENT_URL}/dashboard/jobs/${job._id}/applicants">Review the application</a></p>`
  );
}

export async function sendSubscriptionReceiptEmail(user, payment) {
  const amount = ((payment.amount ?? 0) / 100).toFixed(2); // Razorpay amounts are in paise
  await send(
    user.email,
    'Your HireLoop subscription receipt',
    `<p>Hi ${user.name},</p>
     <p>We've received your payment of ₹${amount}. Thanks for staying on HireLoop!</p>
     <p>You can manage your plan any time from your <a href="${process.env.CLIENT_URL}/dashboard/billing">billing settings</a>.</p>`
  );
}

export async function sendTrialEndingSoonEmail(user, daysLeft) {
  await send(
    user.email,
    `Your HireLoop trial ends in ${daysLeft} day(s)`,
    `<p>Hi ${user.name},</p>
     <p>Your trial ends in ${daysLeft} day(s). Add a payment method to keep your active job posts live.</p>
     <p><a href="${process.env.CLIENT_URL}/pricing">View plans</a></p>`
  );
}

export async function sendApplicationStatusEmail(candidate, job, stage) {
  const friendlyStage = { screened: 'moved to screening', interviewed: 'invited to interview', offered: 'sent an offer', hired: 'hired', rejected: 'not moving forward' }[stage] || stage;
  await send(
    candidate.email,
    `Update on your application to ${job.title}`,
    `<p>Hi ${candidate.name},</p>
     <p>Your application to <strong>${job.title}</strong> at ${job.companyName} has been ${friendlyStage}.</p>`
  );
}

const INTERVIEW_MODE_LABEL = { onsite: 'in person', video: 'video call', phone: 'phone call' };

export async function sendInterviewScheduledEmail(candidate, job, interview) {
  const when = new Date(interview.scheduledAt).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const modeLabel = INTERVIEW_MODE_LABEL[interview.mode] || 'interview';

  await send(
    candidate.email,
    `Interview scheduled: ${job.title} at ${job.companyName}`,
    `<p>Hi ${candidate.name},</p>
     <p>You're invited to interview for <strong>${job.title}</strong> at ${job.companyName}.</p>
     <p>
       <strong>When:</strong> ${when}<br/>
       <strong>Format:</strong> ${modeLabel}<br/>
       ${interview.location ? `<strong>${interview.mode === 'video' ? 'Link' : 'Location'}:</strong> ${interview.location}<br/>` : ''}
     </p>
     ${interview.notes ? `<p><strong>Notes from the recruiter:</strong><br/>${String(interview.notes).replace(/\n/g, '<br/>')}</p>` : ''}
     <p>You can track this application any time from your <a href="${process.env.CLIENT_URL}/candidate">HireLoop dashboard</a>.</p>`
  );
}

export async function sendTeamInviteEmail(toEmail, inviter, org, token) {
  await send(
    toEmail,
    `${inviter.name} invited you to join ${org.name} on HireLoop`,
    `<p>Hi,</p>
     <p><strong>${inviter.name}</strong> invited you to join <strong>${org.name}</strong>'s hiring team on HireLoop.</p>
     <p><a href="${process.env.CLIENT_URL}/dashboard/team/accept/${token}">Accept invite</a></p>
     <p>If you don't have a HireLoop account yet, sign up with this email address first, then open the link above.</p>`
  );
}

export async function sendTalentPoolOutreachEmail(candidate, recruiter, message) {
  await send(
    candidate.email,
    `${recruiter.companyName || recruiter.name} has a role that might interest you`,
    `<p>Hi ${candidate.name},</p>
     <p>${message.replace(/\n/g, '<br/>')}</p>
     <p>— ${recruiter.name}${recruiter.companyName ? `, ${recruiter.companyName}` : ''}</p>`
  );
}
