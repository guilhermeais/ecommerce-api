import { BcryptHasher } from './bcrpyt-hahser';

describe('BcryptHasher', () => {
  let sut: BcryptHasher;

  beforeAll(() => {
    sut = new BcryptHasher();
  });

  it('should hash a plaintext and compare the hash with an plaintext', async () => {
    const hash = await sut.hash('any_plain_text');

    expect(hash).toBeTruthy();

    const compare = await sut.compare('any_plain_text', hash);

    expect(compare).toBeTruthy();
  });
});
