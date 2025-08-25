import { api, events } from "..";
import Auth0 from "../../types";
import { PostChallengeOptions, PostChallengeState } from "../api";

type Handler = (
  event: Auth0.Events.PostChallenge,
  api: Auth0.API.PostChallenge
) => Promise<void>;

export type PostChallengeAssertions = {
  userMetadata: Record<string, any>;
  appMetadata: Record<string, any>;
  accessDenied: false | { reason: string };
  authenticationChallenge: any;
  authenticationEnrollment: any;
  redirectUrl: URL | null;
  cache: Auth0.API.Cache;
};

export type PostChallengeAction = {
  event: Auth0.Events.PostChallenge;
  simulate: (handler: Handler) => Promise<void>;
  assertions: PostChallengeAssertions;
};

export function postChallenge({
  cache,
  now,
  ...attributes
}: Parameters<typeof events.postChallenge>[0] &
  Omit<PostChallengeOptions, "user" | "request"> = {}): PostChallengeAction {
  const event = events.postChallenge(attributes);

  const { request, user } = event;

  const { implementation, state } = api.postChallenge({
    user,
    request,
    now,
    cache,
  });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  const assertions: PostChallengeAssertions = {
    get userMetadata() {
      return { ...state.user.user_metadata };
    },
    get appMetadata() {
      return { ...state.user.app_metadata };
    },
    get accessDenied() {
      return state.access.denied;
    },
    get authenticationChallenge() {
      return state.authentication.challenge;
    },
    get authenticationEnrollment() {
      return state.authentication.enrollment;
    },
    get redirectUrl() {
      return state.redirect?.url || null;
    },
    get cache() {
      return state.cache;
    }
  };

  return {
    event,
    simulate,
    assertions
  };
}
