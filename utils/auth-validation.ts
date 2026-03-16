export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 64;

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9]*$/;

export function sanitizeUsernameInput(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').slice(0, USERNAME_MAX_LENGTH);
}

export function validateUsername(value: string, options?: { required?: boolean }): string | null {
  const normalizedValue = value.trim();
  const required = options?.required ?? true;

  if (!normalizedValue) {
    return required ? 'Digite um nome de usuario.' : null;
  }
  if (normalizedValue.length < USERNAME_MIN_LENGTH) {
    return `Usuario deve ter pelo menos ${USERNAME_MIN_LENGTH} caracteres.`;
  }
  if (normalizedValue.length > USERNAME_MAX_LENGTH) {
    return `Usuario pode ter no maximo ${USERNAME_MAX_LENGTH} caracteres.`;
  }
  if (!USERNAME_REGEX.test(normalizedValue)) {
    return 'Usuario deve comecar com letra e conter apenas letras e numeros.';
  }

  return null;
}

export function validatePasswordLength(value: string, options?: { required?: boolean; label?: string }): string | null {
  const normalizedValue = value.trim();
  const required = options?.required ?? true;
  const label = options?.label ?? 'Senha';

  if (!normalizedValue) {
    return required ? `Digite ${label.toLowerCase()}.` : null;
  }
  if (normalizedValue.length < PASSWORD_MIN_LENGTH) {
    return `${label} deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (normalizedValue.length > PASSWORD_MAX_LENGTH) {
    return `${label} pode ter no maximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  }

  return null;
}
