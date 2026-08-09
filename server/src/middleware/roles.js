/**
 * requireRole('recruiter', 'admin') — must be used after requireAuth.
 * Reusable, composable role gate instead of scattered `if (req.user.role !== ...)` checks.
 */
export function requireRole(...allowedRoles) {
  return function roleGate(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated', code: 'NO_USER' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        code: 'FORBIDDEN_ROLE',
      });
    }
    next();
  };
}

export const requireCandidate = requireRole('candidate');
export const requireRecruiter = requireRole('recruiter');
export const requireAdmin = requireRole('admin');
export const requireRecruiterOrAdmin = requireRole('recruiter', 'admin');
