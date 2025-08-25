import { api, events } from "..";
import Auth0 from "../../types";
import { CredentialsExchangeOptions, CredentialsExchangeState } from "../api";

type Handler = (
  event: Auth0.Events.CredentialsExchange,
  api: Auth0.API.CredentialsExchange
) => Promise<void>;

export type CredentialsExchangeAssertions = {
  accessTokenClaims: Record<string, unknown>;
  accessDenied: false | { code: string; reason: string };
  cache: Auth0.API.Cache;
};

export type CredentialsExchangeAction = {
  event: Auth0.Events.CredentialsExchange;
  simulate: (handler: Handler) => Promise<void>;
  assertions: CredentialsExchangeAssertions;
};

export function credentialsExchange({
  cache,
  ...attributes
}: Parameters<typeof events.credentialsExchange>[0] &
  Omit<CredentialsExchangeOptions, "request"> = {}): CredentialsExchangeAction {
  const event = events.credentialsExchange(attributes);

  const { implementation, state } = api.credentialsExchange({ cache });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  const assertions: CredentialsExchangeAssertions = {
    get accessTokenClaims() {
      return { ...state.accessToken.claims };
    },
    get accessDenied() {
      return state.access.denied;
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
