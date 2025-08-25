import { api, events } from "..";
import Auth0 from "../../types";
import { PostUserRegistrationOptions } from "../api";

type Handler = (
  event: Auth0.Events.PostUserRegistration,
  api: Auth0.API.PostUserRegistration
) => Promise<void>;

export type PostUserRegistrationAssertions = {
  cache: Auth0.API.Cache;
};

export type PostUserRegistrationAction = {
  event: Auth0.Events.PostUserRegistration;
  simulate: (handler: Handler) => Promise<void>;
  assertions: PostUserRegistrationAssertions;
};

export function postUserRegistration({
  cache,
  ...attributes
}: Parameters<typeof events.postUserRegistration>[0] &
  PostUserRegistrationOptions = {}): PostUserRegistrationAction {
  const event = events.postUserRegistration(attributes);

  const { implementation, state } = api.postUserRegistration({ cache });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  const assertions: PostUserRegistrationAssertions = {
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
