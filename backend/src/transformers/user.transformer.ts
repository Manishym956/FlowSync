/**
 * User Transformer — RandomUser API
 *
 * Transforms a raw RandomUser API result into FlowSync's unified User model.
 * All transformation logic is isolated here; the connector and sync engine
 * remain unaware of the external schema.
 */

import { RandomUserResult } from '../connectors/rest/rest.connector';
import { FlowSyncUser } from '../types';

export class UserTransformer {
  /**
   * Transforms a RandomUser API result into a FlowSync User.
   *
   * Mapping:
   *   login.uuid       → externalId
   *   "randomuser"     → sourceSystem
   *   name.first+last  → name
   *   email            → email
   *   phone            → phone
   */
  transform(data: RandomUserResult): FlowSyncUser {
    const name = `${data.name.first} ${data.name.last}`.trim();

    return {
      externalId: data.login.uuid,
      sourceSystem: 'randomuser',
      name,
      email: data.email || undefined,
      phone: data.phone || undefined,
    };
  }
}
