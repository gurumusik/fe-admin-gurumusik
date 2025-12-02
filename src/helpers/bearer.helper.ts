export const bearer = (token?: string) =>
  token ? (token.startsWith?.('Bearer ') ? token : `Bearer ${token}`) : undefined;