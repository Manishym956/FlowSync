import {
  transformFhirPatient,
  transformFhirAppointment,
} from '../../src/transformers/fhir.transformer';

describe('FHIR Patient Transformer', () => {
  const sourceSystem = 'hapi-fhir';

  it('should transform a full Patient resource correctly', () => {
    const mockPatient = {
      resourceType: 'Patient',
      id: 'patient-101',
      name: [
        {
          given: ['Arthur', 'Conan'],
          family: 'Doyle',
        },
      ],
      telecom: [
        { system: 'phone', value: '555-1234' },
        { system: 'email', value: 'arthur@example.com' },
      ],
      gender: 'male',
      birthDate: '1859-05-22',
    };

    const result = transformFhirPatient(mockPatient, sourceSystem);

    expect(result).toEqual({
      externalId: 'patient-101',
      sourceSystem: 'hapi-fhir',
      name: 'Arthur Conan Doyle',
      email: 'arthur@example.com',
      phone: '555-1234',
      gender: 'male',
      birthDate: new Date('1859-05-22'),
    });
  });

  it('should handle missing email, phone, and demographics gracefully', () => {
    const mockPatient = {
      resourceType: 'Patient',
      id: 'patient-102',
    };

    const result = transformFhirPatient(mockPatient, sourceSystem);

    expect(result).toEqual({
      externalId: 'patient-102',
      sourceSystem: 'hapi-fhir',
      name: 'Unknown Patient',
      email: undefined,
      phone: undefined,
      gender: undefined,
      birthDate: undefined,
    });
  });

  it('should throw an error if Patient is missing an ID', () => {
    const mockPatient = {
      resourceType: 'Patient',
      name: [{ family: 'NoID' }],
    };

    expect(() => transformFhirPatient(mockPatient, sourceSystem)).toThrow(
      'Patient resource is missing an ID',
    );
  });
});

describe('FHIR Appointment Transformer', () => {
  const sourceSystem = 'hapi-fhir';

  it('should transform a valid Appointment resource correctly', () => {
    const mockAppointment = {
      resourceType: 'Appointment',
      id: 'appt-201',
      status: 'booked',
      start: '2026-08-01T10:00:00Z',
      end: '2026-08-01T10:30:00Z',
      description: 'Routine Health Checkup',
      participant: [
        {
          actor: { display: 'Dr. John Watson', reference: 'Practitioner/pr-1' },
          required: 'required',
          status: 'accepted',
        },
      ],
    };

    const result = transformFhirAppointment(mockAppointment, sourceSystem);

    expect(result.externalId).toBe('appt-201');
    expect(result.status).toBe('booked');
    expect(result.startedAt).toEqual(new Date('2026-08-01T10:00:00Z'));
    expect(result.completedAt).toEqual(new Date('2026-08-01T10:30:00Z'));
    expect(result.description).toBe('Routine Health Checkup');
    expect(result.metadata?.participants).toHaveLength(1);
    expect(result.metadata?.participants[0].name).toBe('Dr. John Watson');
  });

  it('should throw error if Appointment is missing start time', () => {
    const mockAppointment = {
      resourceType: 'Appointment',
      id: 'appt-invalid',
      status: 'booked',
    };

    expect(() => transformFhirAppointment(mockAppointment, sourceSystem)).toThrow(
      'Appointment is missing start time',
    );
  });
});
