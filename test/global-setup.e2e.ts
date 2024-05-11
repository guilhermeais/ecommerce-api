import forge from 'node-forge';

export async function setup() {
  const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair({
    bits: 2048,
    e: 0x10001,
  });

  const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
  const publicKeyPem = forge.pki.publicKeyToPem(publicKey);

  process.env.JWT_PRIVATE_KEY = Buffer.from(privateKeyPem).toString('base64');
  process.env.JWT_PUBLIC_KEY = Buffer.from(publicKeyPem).toString('base64');
}

export async function teardown() {
  console.log('teardown');
}
