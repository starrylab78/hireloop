import { nanoid } from 'nanoid';
import Organization from '../models/Organization.js';
import TeamInvite from '../models/TeamInvite.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { resolveTeamScope } from '../services/teamScope.js';
import { sendTeamInviteEmail } from '../services/emailService.js';

/** Returns the current user's org (creating one lazily the first time a Scale-plan owner needs it). */
export async function getMyOrganization(req, res, next) {
  try {
    if (req.user.organization) {
      const org = await Organization.findById(req.user.organization).populate('members.user', 'name email');
      return res.json({ organization: org });
    }
    res.json({ organization: null });
  } catch (err) {
    next(err);
  }
}

export async function inviteTeammate(req, res, next) {
  try {
    const { plan, planDef } = await resolveTeamScope(req.user);
    if (planDef.teamSeats <= 1) {
      return res.status(402).json({
        error: 'Team seats are available on the Scale plan. Upgrade to invite teammates.',
        code: 'PLAN_FEATURE_LOCKED',
        feature: 'teamSeats',
        currentPlan: plan,
      });
    }

    let org;
    if (req.user.organization) {
      org = await Organization.findById(req.user.organization);
    } else {
      org = await Organization.create({
        name: req.user.companyName || `${req.user.name}'s team`,
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'owner' }],
      });
      req.user.organization = org._id;
      await req.user.save();
    }

    const seatsUsed = org.members.length;
    if (seatsUsed >= planDef.teamSeats) {
      return res.status(402).json({
        error: `Your Scale plan includes ${planDef.teamSeats} seats and all are in use. Remove a member to invite someone new.`,
        code: 'TEAM_SEATS_FULL',
      });
    }

    const email = req.body.email.toLowerCase();
    const alreadyMember = await User.findOne({ _id: { $in: org.memberUserIds() }, email });
    if (alreadyMember) {
      return res.status(409).json({ error: 'This person is already on your team', code: 'ALREADY_MEMBER' });
    }

    const invite = await TeamInvite.create({
      organization: org._id,
      invitedBy: req.user._id,
      email,
      token: nanoid(32),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    sendTeamInviteEmail(email, req.user, org, invite.token).catch((e) => console.error('[email] team invite failed', e));

    await AuditLog.create({
      actor: req.user._id,
      actorLabel: `user:${req.user._id}`,
      action: 'team.invite.sent',
      targetType: 'Organization',
      targetId: org._id,
      metadata: { email },
    });

    res.status(201).json({ invite: { email: invite.email, status: invite.status, expiresAt: invite.expiresAt } });
  } catch (err) {
    next(err);
  }
}

export async function listPendingInvites(req, res, next) {
  try {
    if (!req.user.organization) return res.json({ invites: [] });
    const invites = await TeamInvite.find({ organization: req.user.organization, status: 'pending' }).sort({ createdAt: -1 });
    res.json({ invites });
  } catch (err) {
    next(err);
  }
}

export async function revokeInvite(req, res, next) {
  try {
    const invite = await TeamInvite.findOne({ _id: req.params.inviteId, organization: req.user.organization });
    if (!invite) return res.status(404).json({ error: 'Invite not found', code: 'INVITE_NOT_FOUND' });
    invite.status = 'revoked';
    await invite.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvite(req, res, next) {
  try {
    const invite = await TeamInvite.findOne({ token: req.params.token, status: 'pending' });
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(410).json({ error: 'This invite is invalid or has expired', code: 'INVITE_EXPIRED' });
    }
    if (req.user.email !== invite.email) {
      return res.status(403).json({ error: 'This invite was sent to a different email address', code: 'INVITE_EMAIL_MISMATCH' });
    }

    const org = await Organization.findById(invite.organization);
    if (!org) return res.status(404).json({ error: 'Team no longer exists', code: 'ORG_NOT_FOUND' });

    if (!org.members.some((m) => String(m.user) === String(req.user._id))) {
      org.members.push({ user: req.user._id, role: 'member' });
      await org.save();
    }

    req.user.organization = org._id;
    req.user.role = 'recruiter';
    await req.user.save();

    invite.status = 'accepted';
    await invite.save();

    await AuditLog.create({
      actor: req.user._id,
      actorLabel: `user:${req.user._id}`,
      action: 'team.invite.accepted',
      targetType: 'Organization',
      targetId: org._id,
    });

    res.json({ organization: org });
  } catch (err) {
    next(err);
  }
}

export async function removeTeammate(req, res, next) {
  try {
    const org = await Organization.findById(req.user.organization);
    if (!org || String(org.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the team owner can remove members', code: 'FORBIDDEN' });
    }
    if (String(req.params.userId) === String(org.owner)) {
      return res.status(400).json({ error: "The owner can't remove themselves", code: 'CANNOT_REMOVE_OWNER' });
    }
    org.members = org.members.filter((m) => String(m.user) !== req.params.userId);
    await org.save();
    await User.findByIdAndUpdate(req.params.userId, { organization: null });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
