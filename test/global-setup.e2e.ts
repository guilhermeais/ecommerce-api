export async function setup() {
  process.env.JWT_PUBLIC_KEY = 'jwt-public';
  process.env.JWT_PRIVATE_KEY = 'jwt-private';
}

export async function teardown() {
  console.log('teardown');
}
