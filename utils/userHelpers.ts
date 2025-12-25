/**
 * Extract user initials from user metadata or email
 * @param user - Supabase user object
 * @returns String with 2 uppercase initials (e.g., "JD", "TE")
 */
export const getUserInitials = (user: any): string => {
  if (!user) return 'U';

  // Try to get from user_metadata.full_name first
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (fullName) {
    const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    if (names.length === 1 && names[0].length >= 2) {
      return names[0].substring(0, 2).toUpperCase();
    }
  }

  // Fallback to email
  const email = user.email || '';
  if (email) {
    const emailParts = email.split('@')[0];
    if (emailParts.length >= 2) {
      return emailParts.substring(0, 2).toUpperCase();
    }
    return emailParts[0]?.toUpperCase() || 'U';
  }

  return 'U';
};

