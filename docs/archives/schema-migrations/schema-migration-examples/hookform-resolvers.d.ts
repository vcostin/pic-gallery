// Mock typings for @hookform/resolvers/zod
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@hookform/resolvers/zod' {
  import { z } from 'zod';
  
  export function zodResolver<T>(schema: z.ZodType<T, any, any>): any;
}
