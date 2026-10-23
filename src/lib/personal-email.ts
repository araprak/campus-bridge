/** New accounts use a lasting personal address; existing university logins stay valid. */
export function isUniversitySignupEmail(email: string): boolean {
  return /@[^@\s]+\.edu$/i.test(email.trim());
}
