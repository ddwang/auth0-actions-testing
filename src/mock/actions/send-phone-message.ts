import { api, events } from "..";
import Auth0 from "../../types";
import { SendPhoneMessageOptions } from "../api";

type Handler = (
  event: Auth0.Events.SendPhoneMessage,
  api: Auth0.API.SendPhoneMessage
) => Promise<void>;

export type SendPhoneMessageAssertions = {
  cache: Auth0.API.Cache;
};

export type SendPhoneMessageAction = {
  event: Auth0.Events.SendPhoneMessage;
  simulate: (handler: Handler) => Promise<void>;
  assertions: SendPhoneMessageAssertions;
};

export function sendPhoneMessage({
  cache,
  ...attributes
}: Parameters<typeof events.sendPhoneMessage>[0] &
  SendPhoneMessageOptions = {}): SendPhoneMessageAction {
  const event = events.sendPhoneMessage(attributes);

  const { implementation, state } = api.sendPhoneMessage({ cache });

  async function simulate(handler: Handler) {
    await handler(event, implementation);
  }

  const assertions: SendPhoneMessageAssertions = {
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
