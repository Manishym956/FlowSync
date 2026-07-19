import { UserTransformer } from '../../src/transformers/user.transformer';

describe('UserTransformer', () => {
  let transformer: UserTransformer;

  beforeEach(() => {
    transformer = new UserTransformer();
  });

  it('should transform a valid RandomUser API payload correctly', () => {
    const mockPayload: any = {
      login: { uuid: 'uuid-12345-abc', username: 'janedoe' },
      name: { title: 'Mr', first: 'Jane', last: 'Doe' },
      email: 'jane.doe@example.com',
      phone: '555-0199',
    };

    const result = transformer.transform(mockPayload);

    expect(result).toEqual({
      externalId: 'uuid-12345-abc',
      sourceSystem: 'randomuser',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '555-0199',
    });
  });

  it('should handle missing optional email and phone fields', () => {
    const mockPayload: any = {
      login: { uuid: 'uuid-67890' },
      name: { first: 'John', last: 'Smith' },
      email: '',
      phone: '',
    };

    const result = transformer.transform(mockPayload);

    expect(result).toEqual({
      externalId: 'uuid-67890',
      sourceSystem: 'randomuser',
      name: 'John Smith',
      email: undefined,
      phone: undefined,
    });
  });

  it('should trim surrounding whitespace from name', () => {
    const mockPayload: any = {
      login: { uuid: 'uuid-trim' },
      name: { first: '  Alice ', last: '  Walker  ' },
    };

    const result = transformer.transform(mockPayload);
    expect(result.name).toBe('Alice    Walker');
  });
});
