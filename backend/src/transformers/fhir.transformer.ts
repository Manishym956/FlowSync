/**
 * FHIR Transformers.
 *
 * Implements data transformations for FHIR Patient and Appointment resources
 * into FlowSync's normalized models.
 *
 * Keeps all raw FHIR formats isolated within this transformer.
 */

import { FlowSyncUser, FlowSyncEvent } from '../types';

// ─── FHIR Patient Transformer ────────────────────────────────────────────────

export function transformFhirPatient(patient: any, sourceSystem: string): FlowSyncUser {
  if (!patient || typeof patient !== 'object') {
    throw new Error('Invalid Patient resource payload');
  }

  // 1. External ID
  const externalId = patient.id;
  if (!externalId) {
    throw new Error('Patient resource is missing an ID');
  }

  // 2. Name parsing
  let name = 'Unknown Patient';
  if (Array.isArray(patient.name) && patient.name.length > 0) {
    const primaryName = patient.name[0];
    const given = Array.isArray(primaryName.given) ? primaryName.given.join(' ') : '';
    const family = primaryName.family ?? '';
    const combined = `${given} ${family}`.trim();
    if (combined) {
      name = combined;
    }
  }

  // 3. Telecom parsing (email and phone)
  let email: string | undefined;
  let phone: string | undefined;
  if (Array.isArray(patient.telecom)) {
    const emailEntry = patient.telecom.find((t: any) => t.system === 'email');
    if (emailEntry && emailEntry.value) {
      email = emailEntry.value;
    }

    const phoneEntry = patient.telecom.find((t: any) => t.system === 'phone' || t.system === 'mobile');
    if (phoneEntry && phoneEntry.value) {
      phone = phoneEntry.value;
    }
  }

  // 4. Gender parsing
  const gender = typeof patient.gender === 'string' ? patient.gender : undefined;

  // 5. BirthDate parsing
  let birthDate: Date | undefined;
  if (patient.birthDate) {
    const parsedDate = new Date(patient.birthDate);
    if (!isNaN(parsedDate.getTime())) {
      birthDate = parsedDate;
    }
  }

  return {
    externalId,
    sourceSystem,
    name,
    email,
    phone,
    gender,
    birthDate,
  };
}

// ─── FHIR Appointment Transformer ─────────────────────────────────────────────

export function transformFhirAppointment(appointment: any, sourceSystem: string): FlowSyncEvent {
  if (!appointment || typeof appointment !== 'object') {
    throw new Error('Invalid Appointment resource payload');
  }

  // 1. External ID
  const externalId = appointment.id;
  if (!externalId) {
    throw new Error('Appointment resource is missing an ID');
  }

  // 2. Status
  const status = typeof appointment.status === 'string' ? appointment.status : 'unknown';

  // 3. Start time
  const startStr = appointment.start;
  if (!startStr) {
    throw new Error('Appointment is missing start time');
  }
  const startedAt = new Date(startStr);
  if (isNaN(startedAt.getTime())) {
    throw new Error(`Appointment has invalid start time: ${startStr}`);
  }

  // 4. End time
  let completedAt: Date | undefined;
  if (appointment.end) {
    const parsedEnd = new Date(appointment.end);
    if (!isNaN(parsedEnd.getTime())) {
      completedAt = parsedEnd;
    }
  }

  // 5. Description
  let description = appointment.description ?? '';
  if (!description && Array.isArray(appointment.reasonCode) && appointment.reasonCode.length > 0) {
    const primaryReason = appointment.reasonCode[0];
    if (primaryReason.text) {
      description = primaryReason.text;
    } else if (Array.isArray(primaryReason.coding) && primaryReason.coding.length > 0) {
      description = primaryReason.coding[0].display ?? '';
    }
  }

  // 6. Participants
  const participants: any[] = [];
  if (Array.isArray(appointment.participant)) {
    for (const part of appointment.participant) {
      const actorName = part.actor?.display ?? '';
      const reference = part.actor?.reference ?? '';
      const required = part.required ?? 'optional';
      const partStatus = part.status ?? 'unknown';

      if (actorName || reference) {
        participants.push({
          name: actorName,
          reference,
          required,
          status: partStatus,
        });
      }
    }
  }

  // 7. Metadata object
  const metadata: Record<string, any> = {
    participants,
  };
  if (appointment.appointmentType?.text) {
    metadata.appointmentType = appointment.appointmentType.text;
  }
  if (appointment.created) {
    metadata.created = appointment.created;
  }

  return {
    externalId,
    sourceSystem,
    entityType: 'appointment',
    status,
    startedAt,
    completedAt,
    description: description || undefined,
    metadata,
  };
}
