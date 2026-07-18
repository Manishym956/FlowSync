/**
 * Connector Registry.
 *
 * Maps integration type strings to connector factory functions.
 * The sync engine uses this to dynamically resolve the correct
 * connector without containing provider-specific logic (TRD §6).
 *
 * New connectors are registered here. The sync engine does not need
 * to be modified when a new integration is added.
 */

import { Connector } from './base.connector';
import { RestConnector } from './rest/rest.connector';
import { FhirConnector } from './fhir/fhir.connector';
import { MessagingConnector } from './messaging/messaging.connector';
import { IntegrationType } from '../types';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConnectorFactory = () => Connector<any, any>;

const registry: Record<string, ConnectorFactory> = {
  rest: () => new RestConnector(env.RANDOM_USER_API_URL),
  fhir: () => new FhirConnector(env.FHIR_BASE_URL),
  messaging: () => new MessagingConnector(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL),
};

/**
 * Returns a connector instance for the given integration type.
 * Throws if the type is not registered.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveConnector(type: IntegrationType | string): Connector<any, any> {
  const factory = registry[type];
  if (!factory) {
    throw new Error(`No connector registered for integration type: "${type}"`);
  }
  return factory();
}

/**
 * Returns true if a connector is registered for the given type.
 */
export function hasConnector(type: string): boolean {
  return type in registry;
}
