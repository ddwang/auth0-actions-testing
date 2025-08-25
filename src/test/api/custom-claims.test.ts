import test from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { postLogin } from "../../mock/actions/post-login";
import Auth0 from "../../types";

test("Custom Claims Testing", async (t) => {
  await t.test("should track custom claims set on access token", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      api.accessToken.setCustomClaim("https://example.com/role", "admin");
      api.accessToken.setCustomClaim("https://example.com/permissions", ["read", "write"]);
    };

    const action = postLogin({});
    await action.simulate(handler);

    // Access custom claims through assertions API
    deepStrictEqual(action.assertions.accessTokenClaims, {
      "https://example.com/role": "admin",
      "https://example.com/permissions": ["read", "write"],
    });
  });

  await t.test("should track custom claims set on ID token", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      api.idToken.setCustomClaim("https://example.com/email", "user@example.com");
      api.idToken.setCustomClaim("https://example.com/metadata", { tier: "premium", active: true });
    };

    const action = postLogin({});
    await action.simulate(handler);

    // Access custom claims through assertions API
    deepStrictEqual(action.assertions.idTokenClaims, {
      "https://example.com/email": "user@example.com",
      "https://example.com/metadata": { tier: "premium", active: true },
    });
  });

  await t.test("should handle conditional claim logic based on user properties", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      if (event.stats.logins_count === 1) {
        api.accessToken.setCustomClaim("https://example.com/event", "signup");
        api.accessToken.setCustomClaim("https://example.com/welcome", true);
      } else {
        api.accessToken.setCustomClaim("https://example.com/event", "login");
        api.accessToken.setCustomClaim("https://example.com/returning", true);
      }
    };

    // Test first-time user
    const firstTimeUser = postLogin({
      stats: { logins_count: 1 },
    });
    await firstTimeUser.simulate(handler);

    strictEqual(firstTimeUser.assertions.accessTokenClaims["https://example.com/event"], "signup");
    strictEqual(firstTimeUser.assertions.accessTokenClaims["https://example.com/welcome"], true);
    strictEqual(firstTimeUser.assertions.accessTokenClaims["https://example.com/returning"], undefined);

    // Test returning user
    const returningUser = postLogin({
      stats: { logins_count: 5 },
    });
    await returningUser.simulate(handler);

    strictEqual(returningUser.assertions.accessTokenClaims["https://example.com/event"], "login");
    strictEqual(returningUser.assertions.accessTokenClaims["https://example.com/returning"], true);
    strictEqual(returningUser.assertions.accessTokenClaims["https://example.com/welcome"], undefined);
  });

  await t.test("should set different claims on access vs ID tokens", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      // Access token gets permissions
      api.accessToken.setCustomClaim("https://example.com/permissions", ["read:users", "write:users"]);
      api.accessToken.setCustomClaim("https://example.com/role", "admin");

      // ID token gets user info
      api.idToken.setCustomClaim("https://example.com/name", event.user.name);
      api.idToken.setCustomClaim("https://example.com/email", event.user.email);

      // Both get a shared claim
      api.accessToken.setCustomClaim("https://example.com/tenant", "acme-corp");
      api.idToken.setCustomClaim("https://example.com/tenant", "acme-corp");
    };

    const action = postLogin({
      user: {
        name: "Alice Johnson",
        email: "alice@example.com",
      },
    });
    await action.simulate(handler);

    // Access token should have permissions but not user info
    strictEqual(action.assertions.accessTokenClaims["https://example.com/role"], "admin");
    deepStrictEqual(action.assertions.accessTokenClaims["https://example.com/permissions"], ["read:users", "write:users"]);
    strictEqual(action.assertions.accessTokenClaims["https://example.com/name"], undefined);
    strictEqual(action.assertions.accessTokenClaims["https://example.com/email"], undefined);
    strictEqual(action.assertions.accessTokenClaims["https://example.com/tenant"], "acme-corp");

    // ID token should have user info but not permissions
    strictEqual(action.assertions.idTokenClaims["https://example.com/name"], "Alice Johnson");
    strictEqual(action.assertions.idTokenClaims["https://example.com/email"], "alice@example.com");
    strictEqual(action.assertions.idTokenClaims["https://example.com/permissions"], undefined);
    strictEqual(action.assertions.idTokenClaims["https://example.com/role"], undefined);
    strictEqual(action.assertions.idTokenClaims["https://example.com/tenant"], "acme-corp");
  });

  await t.test("should handle multiple calls to same claim (last write wins)", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      api.accessToken.setCustomClaim("https://example.com/value", "first");
      api.accessToken.setCustomClaim("https://example.com/value", "second");
      api.accessToken.setCustomClaim("https://example.com/value", "final");
    };

    const action = postLogin({});
    await action.simulate(handler);

    strictEqual(action.assertions.accessTokenClaims["https://example.com/value"], "final");
  });

  await t.test("should return empty object when no claims are set", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      // No custom claims set
    };

    const action = postLogin({});
    await action.simulate(handler);

    deepStrictEqual(action.assertions.accessTokenClaims, {});
    deepStrictEqual(action.assertions.idTokenClaims, {});
  });

  await t.test("should handle complex claim values", async () => {
    const handler: (event: Auth0.Events.PostLogin, api: Auth0.API.PostLogin) => Promise<void> = async (event, api) => {
      api.accessToken.setCustomClaim("https://example.com/string", "value");
      api.accessToken.setCustomClaim("https://example.com/number", 42);
      api.accessToken.setCustomClaim("https://example.com/boolean", true);
      api.accessToken.setCustomClaim("https://example.com/array", [1, 2, 3]);
      api.accessToken.setCustomClaim("https://example.com/object", {
        nested: {
          deeply: {
            value: "found",
          },
        },
      });
      api.accessToken.setCustomClaim("https://example.com/null", null);
    };

    const action = postLogin({});
    await action.simulate(handler);

    strictEqual(action.assertions.accessTokenClaims["https://example.com/string"], "value");
    strictEqual(action.assertions.accessTokenClaims["https://example.com/number"], 42);
    strictEqual(action.assertions.accessTokenClaims["https://example.com/boolean"], true);
    deepStrictEqual(action.assertions.accessTokenClaims["https://example.com/array"], [1, 2, 3]);
    deepStrictEqual(action.assertions.accessTokenClaims["https://example.com/object"], {
      nested: {
        deeply: {
          value: "found",
        },
      },
    });
    strictEqual(action.assertions.accessTokenClaims["https://example.com/null"], null);
  });
});