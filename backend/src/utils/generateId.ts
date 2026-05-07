import { customAlphabet } from 'nanoid';

const numeric = customAlphabet('0123456789', 6);

export const generateProjectId = (): string =>
  `PROJ-${new Date().getFullYear()}-${numeric()}`;

export const generateTenderId = (): string =>
  `TND-${new Date().getFullYear()}-${numeric()}`;

export const generateWorkOrderId = (): string =>
  `WO-${new Date().getFullYear()}-${numeric()}`;

export const generateMBId = (): string =>
  `MB-${new Date().getFullYear()}-${numeric()}`;

export const generateBillId = (): string =>
  `BILL-${new Date().getFullYear()}-${numeric()}`;

export const generatePaymentId = (): string =>
  `PAY-${new Date().getFullYear()}-${numeric()}`;

export const generateLOAId = (): string =>
  `LOA-${new Date().getFullYear()}-${numeric()}`;
