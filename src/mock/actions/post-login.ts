import { api, events } from "..";
import Auth0 from "../../types";
import { PostLoginOptions, PostLoginState } from "../api";

type Handler = (
  event: Auth0.Events.PostLogin,
  api: Auth0.API.PostLogin
) => Promise<void>;

export type PostLoginAssertions = {
  accessTokenClaims: Record<string, unknown>;
  accessTokenScopes: string[];
  idTokenClaims: Record<string, unknown>;
  userMetadata: Record<string, any>;
  appMetadata: Record<string, any>;
  accessDenied: false | { reason: string };
  multifactorEnabled: false | { provider: string; options?: any };
  redirectUrl: URL | null;
  cache: Auth0.API.Cache;
  primaryUserId: string;
};

export type PostLoginAction = {
  event: Auth0.Events.PostLogin;
  simulate: (handler: Handler) => Promise<void>;
  assertions: PostLoginAssertions;
};

export function postLogin({
  cache,
  now,
  executedRules,
  ...attributes
}: Parameters<typeof events.postLogin>[0] &
  Omit<PostLoginOptions, "user" | "request"> = {}): PostLoginAction {
  const event = events.postLogin(attributes);

  const { request, user } = event;

  const { implementation, state } = api.postLogin({
    user,
    request,
    now,
    executedRules,
    cache,
  });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  // Create assertions object that provides test-specific access to state
  const assertions: PostLoginAssertions = {
    get accessTokenClaims() {
      return { ...state.accessToken.claims };
    },
    get accessTokenScopes() {
      return [...state.accessToken.scopes];
    },
    get idTokenClaims() {
      return { ...state.idToken.claims };
    },
    get userMetadata() {
      return { ...state.user.user_metadata };
    },
    get appMetadata() {
      return { ...state.user.app_metadata };
    },
    get accessDenied() {
      return state.access.denied;
    },
    get multifactorEnabled() {
      return state.multifactor.enabled;
    },
    get redirectUrl() {
      return state.redirect?.url || null;
    },
    get cache() {
      return state.cache;
    },
    get primaryUserId() {
      return state.authentication.primaryUserId;
    }
  };

  return {
    event,
    simulate,
    assertions
  };
}
