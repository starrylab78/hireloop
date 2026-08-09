import User from '../models/User.js';
import Job from '../models/Job.js';
import { resolveTeamScope } from '../services/teamScope.js';

export async function getCompanyProfile(req, res, next) {
  try {
    const owner = await User.findOne({ companySlug: req.params.slug, role: 'recruiter' });
    if (!owner) return res.status(404).json({ error: 'Company not found', code: 'COMPANY_NOT_FOUND' });

    const scope = await resolveTeamScope(owner);
    const jobs = await Job.find({ recruiter: { $in: scope.teamUserIds }, status: 'active' })
      .select('title location workMode experienceLevel salaryMin salaryMax currency createdAt')
      .sort({ createdAt: -1 });

    res.json({
      company: {
        name: owner.companyName,
        website: owner.companyWebsite,
        logoUrl: owner.companyLogoUrl,
        description: owner.companyDescription,
        slug: owner.companySlug,
      },
      jobs,
    });
  } catch (err) {
    next(err);
  }
}
