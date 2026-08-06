import { ValidationPipe } from '@nestjs/common';

// Shared by main.ts (real bootstrap) and test/utils/create-test-app.ts
// (e2e tests build the Nest app directly via TestingModule, bypassing
// main.ts entirely) so the two never drift apart.
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });
}
