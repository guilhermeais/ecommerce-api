import { ConfirmationToken } from './confirmation-token';

describe('ConfirmationToken entity', () => {
  describe('isExpired()', () => {
    it('should return true if the confirmation token is expired', () => {
      const token = ConfirmationToken.create({
        token: 'any_token',
        expiresIn: 1000,
        userId: 'any_user_id',
        createdAt: new Date('2021-01-01'),
      });

      const now = new Date('2021-01-02');

      expect(token.isExpired(now)).toBe(true);
    });

    it('should return false if the confirmation token is not expired', () => {
      const token = ConfirmationToken.create({
        token: 'any_token',
        expiresIn: 1000,
        userId: 'any_user_id',
        createdAt: new Date(2021, 1, 1, 10, 0, 0),
      });

      const now = new Date(2021, 1, 1, 10, 0, 0);

      expect(token.isExpired(now)).toBe(false);
    });
  });
});
