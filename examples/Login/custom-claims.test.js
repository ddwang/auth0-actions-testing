const test = require("node:test");
const { strictEqual, deepStrictEqual, ok } = require("node:assert");
const { onExecutePostLogin } = require("./custom-claims");
const { mock } = require("../../dist");

test("Custom Claims", async (t) => {
  await t.test("should add admin role claims to access token", async () => {
    const action = mock.actions.postLogin({
      authorization: {
        roles: ["admin", "user"]
      }
    });

    await action.simulate(onExecutePostLogin);

    // Verify admin claims on access token through assertions API
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/role"], "admin");
    deepStrictEqual(action.assertions.accessTokenClaims["https://myapp.com/permissions"], [
      "read:users",
      "write:users",
      "delete:users",
      "read:settings",
      "write:settings"
    ]);

    // Verify these claims are NOT on the ID token
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/role"], undefined);
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/permissions"], undefined);
  });

  await t.test("should add user role claims to access token", async () => {
    const action = mock.actions.postLogin({
      authorization: {
        roles: ["user"]
      }
    });

    await action.simulate(onExecutePostLogin);

    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/role"], "user");
    deepStrictEqual(action.assertions.accessTokenClaims["https://myapp.com/permissions"], [
      "read:own_profile",
      "write:own_profile"
    ]);
  });

  await t.test("should add user metadata to ID token", async () => {
    const userMetadata = {
      preferences: {
        theme: "dark",
        language: "en"
      }
    };

    const action = mock.actions.postLogin({
      user: mock.user({
        user_metadata: userMetadata,
        email_verified: true
      })
    });

    await action.simulate(onExecutePostLogin);

    // Verify user metadata on ID token through assertions API
    deepStrictEqual(action.assertions.idTokenClaims["https://myapp.com/user_metadata"], userMetadata);
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/email_verified"], true);

    // Verify these are NOT on access token
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/user_metadata"], undefined);
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/email_verified"], undefined);
  });

  await t.test("should add tenant information to both tokens", async () => {
    const action = mock.actions.postLogin({
      user: mock.user({
        app_metadata: {
          tenant: "acme-corp"
        }
      })
    });

    await action.simulate(onExecutePostLogin);

    // Verify tenant is on both tokens through assertions API
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/tenant"], "acme-corp");
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/tenant"], "acme-corp");
  });

  await t.test("should add welcome claims for first-time users", async () => {
    const action = mock.actions.postLogin({
      stats: {
        logins_count: 1
      }
    });

    await action.simulate(onExecutePostLogin);

    // Verify welcome claims on ID token through assertions API
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/welcome"], true);
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/onboarding_required"], true);

    // These should NOT be on access token
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/welcome"], undefined);
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/onboarding_required"], undefined);
  });

  await t.test("should not add welcome claims for returning users", async () => {
    const action = mock.actions.postLogin({
      stats: {
        logins_count: 10
      }
    });

    await action.simulate(onExecutePostLogin);

    // Verify no welcome claims for returning users
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/welcome"], undefined);
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/onboarding_required"], undefined);
  });

  await t.test("should add subscription information to access token", async () => {
    const subscriptionData = {
      tier: "premium",
      expires_at: "2024-12-31T23:59:59Z"
    };

    const action = mock.actions.postLogin({
      user: mock.user({
        app_metadata: {
          subscription: subscriptionData
        }
      })
    });

    await action.simulate(onExecutePostLogin);

    // Verify subscription claims on access token through assertions API
    deepStrictEqual(action.assertions.accessTokenClaims["https://myapp.com/subscription"], subscriptionData);

    // Should NOT be on ID token
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/subscription"], undefined);
  });

  await t.test("should handle users with no roles", async () => {
    const action = mock.actions.postLogin({
      authorization: {
        roles: []
      }
    });

    await action.simulate(onExecutePostLogin);

    // Should not have role or permission claims
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/role"], undefined);
    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/permissions"], undefined);
  });

  await t.test("should use default tenant when not specified", async () => {
    const action = mock.actions.postLogin({
      user: mock.user({
        app_metadata: {}
      })
    });

    await action.simulate(onExecutePostLogin);

    strictEqual(action.assertions.accessTokenClaims["https://myapp.com/tenant"], "default");
    strictEqual(action.assertions.idTokenClaims["https://myapp.com/tenant"], "default");
  });

  await t.test("comprehensive integration test", async () => {
    const action = mock.actions.postLogin({
      user: mock.user({
        email_verified: true,
        user_metadata: {
          name: "Alice Johnson"
        },
        app_metadata: {
          tenant: "enterprise",
          subscription: {
            tier: "gold",
            expires_at: "2025-01-01T00:00:00Z"
          }
        }
      }),
      authorization: {
        roles: ["admin"]
      },
      stats: {
        logins_count: 1
      }
    });

    await action.simulate(onExecutePostLogin);

    // Access Token should have:
    // - Role and permissions
    // - Tenant
    // - Subscription
    const accessClaims = action.assertions.accessTokenClaims;
    strictEqual(accessClaims["https://myapp.com/role"], "admin");
    ok(Array.isArray(accessClaims["https://myapp.com/permissions"]));
    strictEqual(accessClaims["https://myapp.com/tenant"], "enterprise");
    deepStrictEqual(accessClaims["https://myapp.com/subscription"], {
      tier: "gold",
      expires_at: "2025-01-01T00:00:00Z"
    });

    // ID Token should have:
    // - User metadata
    // - Email verified
    // - Tenant
    // - Welcome flags (first login)
    const idClaims = action.assertions.idTokenClaims;
    deepStrictEqual(idClaims["https://myapp.com/user_metadata"], {
      name: "Alice Johnson"
    });
    strictEqual(idClaims["https://myapp.com/email_verified"], true);
    strictEqual(idClaims["https://myapp.com/tenant"], "enterprise");
    strictEqual(idClaims["https://myapp.com/welcome"], true);
    strictEqual(idClaims["https://myapp.com/onboarding_required"], true);

    // Verify separation of concerns - claims should be on correct tokens only
    strictEqual(accessClaims["https://myapp.com/user_metadata"], undefined);
    strictEqual(accessClaims["https://myapp.com/welcome"], undefined);
    strictEqual(idClaims["https://myapp.com/role"], undefined);
    strictEqual(idClaims["https://myapp.com/subscription"], undefined);
  });
});