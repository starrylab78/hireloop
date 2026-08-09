import TalentPoolEntry from '../models/TalentPoolEntry.js';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { resolveTeamScope } from '../services/teamScope.js';
import { sendTalentPoolOutreachEmail } from '../services/emailService.js';

/** Save a candidate to the team's talent pool, optionally from a specific application. */
export async function saveToTalentPool(req, res, next) {
  try {
    const { candidateId, applicationId, notes, tags } = req.body;
    const scope = await resolveTeamScope(req.user);
    const ownerId = scope.org ? scope.org.owner : req.user._id; // one shared pool per org, keyed to the owner

    let sourceJobTitle = '';
    if (applicationId) {
      const application = await Application.findById(applicationId).populate('job', 'title');
      if (application) sourceJobTitle = application.job?.title || '';
    }

    const entry = await TalentPoolEntry.findOneAndUpdate(
      { recruiter: ownerId, candidate: candidateId },
      {
        recruiter: ownerId,
        candidate: candidateId,
        sourceApplication: applicationId || null,
        sourceJobTitle,
        $setOnInsert: {},
        ...(notes !== undefined ? { notes } : {}),
        ...(tags !== undefined ? { tags } : {}),
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function listTalentPool(req, res, next) {
  try {
    const scope = await resolveTeamScope(req.user);
    const ownerId = scope.org ? scope.org.owner : req.user._id;

    const entries = await TalentPoolEntry.find({ recruiter: ownerId })
      .populate('candidate', 'name email candidateProfile.headline candidateProfile.skills candidateProfile.experienceYears candidateProfile.location')
      .sort({ createdAt: -1 });

    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

export async function removeFromTalentPool(req, res, next) {
  try {
    const scope = await resolveTeamScope(req.user);
    const ownerId = scope.org ? scope.org.owner : req.user._id;

    await TalentPoolEntry.findOneAndDelete({ _id: req.params.id, recruiter: ownerId });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** Re-contact a candidate in the pool with a custom message. */
export async function recontactCandidate(req, res, next) {
  try {
    const { message } = req.body;
    const scope = await resolveTeamScope(req.user);
    const ownerId = scope.org ? scope.org.owner : req.user._id;

    const entry = await TalentPoolEntry.findOne({ _id: req.params.id, recruiter: ownerId }).populate('candidate', 'name email');
    if (!entry) return res.status(404).json({ error: 'Talent pool entry not found', code: 'ENTRY_NOT_FOUND' });

    await sendTalentPoolOutreachEmail(entry.candidate, req.user, message);

    entry.lastContactedAt = new Date();
    await entry.save();

    res.json({ ok: true, lastContactedAt: entry.lastContactedAt });
  } catch (err) {
    next(err);
  }
}
