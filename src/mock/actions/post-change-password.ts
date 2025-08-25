import { api, events } from "..";
import Auth0 from "../../types";
import { PostChangePasswordOptions } from "../api";

type Handler = (
  event: Auth0.Events.PostChangePassword,
  api: Auth0.API.PostChangePassword
) => Promise<void>;

export type PostChangePasswordAssertions = {
  cache: Auth0.API.Cache;
};

export type PostChangePasswordAction = {
  event: Auth0.Events.PostChangePassword;
  simulate: (handler: Handler) => Promise<void>;
  assertions: PostChangePasswordAssertions;
};

export function postChangePassword({
  cache,
  ...attributes
}: Parameters<typeof events.postChangePassword>[0] &
  PostChangePasswordOptions = {}): PostChangePasswordAction {
  const event = events.postChangePassword(attributes);

  const { implementation, state } = api.postChangePassword({ cache });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  const assertions: PostChangePasswordAssertions = {
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
