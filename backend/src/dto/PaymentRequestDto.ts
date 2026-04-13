export interface PaymentRequestDto {
    wallet: string;
    token_id:number;
    quantity?:number;
    price_amount: number;
    price_currency: string;
    pay_currency: string;
}