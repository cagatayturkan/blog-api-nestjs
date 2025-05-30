export enum BlacklistReason {
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  LOGOUT_ALL_DEVICES = 'logout_all_devices',
  ADMIN_REVOKE = 'admin_revoke',
  SECURITY = 'security'
}

export const PASSWORD_RELATED_REASONS = [
  BlacklistReason.PASSWORD_CHANGE,
  BlacklistReason.PASSWORD_RESET
]; 