import { Factory, DeepPartial } from "fishery";

/**
 * A factory function that builds mock objects
 */
export type MockFactory<T, I = any> = (
  attributes?: DeepPartial<T>,
  transient?: Partial<I>
) => T;

/**
 * Define a new mock factory. This will return the Fishery factory's `build`
 * function.
 */
export function define<T, I = any>(
  ...args: Parameters<typeof Factory.define<T, I>>
): MockFactory<T, I> {
  const factory = Factory.define<T, I>(...args);

  return (
    attributes?: DeepPartial<T>,
    transient?: Partial<I>
  ): T => {
    return factory.build(attributes as Parameters<typeof factory.build>[0], {
      transient,
    });
  };
}
