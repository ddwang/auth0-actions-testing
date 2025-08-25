# Assertions API - Testing Auth0 Actions

## Overview

The Auth0 Actions Testing library provides an `assertions` API that clearly separates test-specific functionality from Auth0's actual API. This design makes it explicit which properties are for testing versus what's available in the Auth0 runtime.

## Key Design Principle

**Clear Separation**: Everything under `action.assertions.*` is test-specific and not part of Auth0's actual API.

In Auth0's actual runtime:
- You can **write** claims: `api.accessToken.setCustomClaim('namespace/claim', value)`
- You **cannot read** what claims were set during execution

In this testing library:
- You can **write** claims the same way (during simulation)
- You can **read** what was written via `action.assertions.*` (after simulation)

## API Reference

### PostLogin Assertions

After simulating a PostLogin action, the following assertions are available:

```javascript
const action = mock.actions.postLogin({...});
await action.simulate(onExecutePostLogin);

// Available assertions:
action.assertions.accessTokenClaims    // Record<string, unknown>
action.assertions.accessTokenScopes    // string[]
action.assertions.idTokenClaims        // Record<string, unknown>
action.assertions.userMetadata         // Record<string, any>
action.assertions.appMetadata          // Record<string, any>
action.assertions.accessDenied         // false | { reason: string }
action.assertions.multifactorEnabled   // false | { provider: string; options?: any }
action.assertions.redirectUrl          // URL | null
action.assertions.cache                // Auth0.API.Cache
```

## Usage Examples

### Testing Custom Claims

```javascript
test('should set custom claims on tokens', async () => {
  const action = mock.actions.postLogin({
    user: mock.user({
      email: 'user@example.com',
      app_metadata: { role: 'admin' }
    })
  });

  await action.simulate(async (event, api) => {
    // Write claims using Auth0's API
    api.accessToken.setCustomClaim('https://myapp.com/role', event.user.app_metadata.role);
    api.idToken.setCustomClaim('https://myapp.com/email', event.user.email);
  });

  // Assert using the test-specific assertions API
  strictEqual(action.assertions.accessTokenClaims['https://myapp.com/role'], 'admin');
  strictEqual(action.assertions.idTokenClaims['https://myapp.com/email'], 'user@example.com');
});
```

### Testing Access Control

```javascript
test('should deny access for blocked users', async () => {
  const action = mock.actions.postLogin({
    user: mock.user({ blocked: true })
  });

  await action.simulate(async (event, api) => {
    if (event.user.blocked) {
      api.access.deny('User is blocked');
    }
  });

  // Check if access was denied
  deepStrictEqual(action.assertions.accessDenied, { reason: 'User is blocked' });
});
```

### Testing User Metadata Updates

```javascript
test('should update user metadata', async () => {
  const action = mock.actions.postLogin({});

  await action.simulate(async (event, api) => {
    api.user.setUserMetadata('preferences', { theme: 'dark' });
    api.user.setAppMetadata('subscription', 'premium');
  });

  // Assert metadata was updated
  deepStrictEqual(action.assertions.userMetadata, { preferences: { theme: 'dark' } });
  deepStrictEqual(action.assertions.appMetadata, { subscription: 'premium' });
});
```

### Testing Multifactor Authentication

```javascript
test('should enable MFA for admin users', async () => {
  const action = mock.actions.postLogin({
    authorization: { roles: ['admin'] }
  });

  await action.simulate(async (event, api) => {
    if (event.authorization.roles.includes('admin')) {
      api.multifactor.enable('guardian');
    }
  });

  // Check MFA was enabled
  deepStrictEqual(action.assertions.multifactorEnabled, { 
    provider: 'guardian' 
  });
});
```

## Benefits of This Design

1. **No Confusion**: Developers won't mistake test functionality for Auth0's actual API
2. **Self-Documenting**: The `assertions` namespace makes it clear these are for testing
3. **TypeScript Friendly**: Strong typing without complex Proxy patterns
4. **Future-Proof**: Easy to extend with new assertions without polluting the API surface

## Migration from Direct Access

If you were previously accessing state properties directly (which may have required TypeScript casting), update your tests:

```javascript
// Old way (may require TypeScript casting or cause errors)
action.accessToken.claims['namespace/claim']
action.idToken.claims['namespace/claim']

// New way (explicit and type-safe)
action.assertions.accessTokenClaims['namespace/claim']
action.assertions.idTokenClaims['namespace/claim']
```

## Implementation Status

✅ **Completed**: All action types now use the assertions API pattern

### Available Assertions by Action Type

#### PostLogin
- `accessTokenClaims`, `accessTokenScopes`, `idTokenClaims`
- `userMetadata`, `appMetadata`
- `accessDenied`, `multifactorEnabled`
- `redirectUrl`, `cache`

#### PreUserRegistration
- `userMetadata`, `appMetadata`
- `accessDenied`, `validationError`
- `cache`

#### PostUserRegistration
- `cache`

#### PostChangePassword
- `cache`

#### PostChallenge
- `userMetadata`, `appMetadata`
- `accessDenied`
- `authenticationChallenge`, `authenticationEnrollment`
- `redirectUrl`, `cache`

#### CredentialsExchange
- `accessTokenClaims`
- `accessDenied`
- `cache`

#### SendPhoneMessage
- `cache`

All action types now follow the same consistent pattern where test-specific functionality is clearly separated under the `assertions` namespace.