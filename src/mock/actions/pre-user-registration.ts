import { api, events } from "..";
import Auth0 from "../../types";
import { PreUserRegistrationOptions, PreUserRegistrationState } from "../api";

type Handler = (
  event: Auth0.Events.PreUserRegistration,
  api: Auth0.API.PreUserRegistration
) => Promise<void>;

export type PreUserRegistrationAssertions = {
  userMetadata: Record<string, any>;
  appMetadata: Record<string, any>;
  accessDenied: false | { code: string; reason: string };
  validationError: { code: string; message: string } | null;
  cache: Auth0.API.Cache;
};

export type PreUserRegistrationAction = {
  event: Auth0.Events.PreUserRegistration;
  simulate: (handler: Handler) => Promise<void>;
  assertions: PreUserRegistrationAssertions;
};

export function preUserRegistration({
  cache,
  now,
  ...attributes
}: Parameters<typeof events.preUserRegistration>[0] &
  Omit<PreUserRegistrationOptions, "user" | "request"> = {}): PreUserRegistrationAction {
  const event = events.preUserRegistration(attributes);

  const { request, user } = event;

  const { implementation, state } = api.preUserRegistration({
    user,
    request,
    now,
    cache,
  });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  const assertions: PreUserRegistrationAssertions = {
    get userMetadata() {
      return { ...state.user.user_metadata };
    },
    get appMetadata() {
      return { ...state.user.app_metadata };
    },
    get accessDenied() {
      return state.access.denied;
    },
    get validationError() {
      return state.validation.error;
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
