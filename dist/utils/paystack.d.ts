export declare const initializeTransaction: (email: string, amount: number, metadata: any) => Promise<any>;
export declare const verifyTransaction: (reference: string) => Promise<any>;
export declare const chargeMpesa: (email: string, amount: number, phone: string, metadata: any, reference?: string) => Promise<any>;
//# sourceMappingURL=paystack.d.ts.map