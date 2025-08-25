/**
 * Auth0 Action that adds custom claims based on user properties and roles
 */
exports.onExecutePostLogin = async (event, api) => {
  // Add role-based claims to access token
  const roles = event.authorization?.roles || [];
  
  if (roles.includes("admin")) {
    api.accessToken.setCustomClaim("https://myapp.com/role", "admin");
    api.accessToken.setCustomClaim("https://myapp.com/permissions", [
      "read:users",
      "write:users",
      "delete:users",
      "read:settings",
      "write:settings"
    ]);
  } else if (roles.includes("user")) {
    api.accessToken.setCustomClaim("https://myapp.com/role", "user");
    api.accessToken.setCustomClaim("https://myapp.com/permissions", [
      "read:own_profile",
      "write:own_profile"
    ]);
  }

  // Add user metadata to ID token
  api.idToken.setCustomClaim("https://myapp.com/user_metadata", event.user.user_metadata);
  api.idToken.setCustomClaim("https://myapp.com/email_verified", event.user.email_verified);

  // Add tenant information to both tokens
  const tenant = event.user.app_metadata?.tenant || "default";
  api.accessToken.setCustomClaim("https://myapp.com/tenant", tenant);
  api.idToken.setCustomClaim("https://myapp.com/tenant", tenant);

  // Add special claims for first-time users
  if (event.stats.logins_count === 1) {
    api.idToken.setCustomClaim("https://myapp.com/welcome", true);
    api.idToken.setCustomClaim("https://myapp.com/onboarding_required", true);
  }

  // Add subscription tier from app metadata
  if (event.user.app_metadata?.subscription) {
    api.accessToken.setCustomClaim("https://myapp.com/subscription", {
      tier: event.user.app_metadata.subscription.tier,
      expires_at: event.user.app_metadata.subscription.expires_at
    });
  }
};