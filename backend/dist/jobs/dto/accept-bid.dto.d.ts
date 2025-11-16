export declare enum ContactPreferenceMethod {
    EMAIL = "email",
    PHONE = "phone",
    WALLET = "wallet",
    OFFCHAIN = "offchain"
}
export declare class BidResponseAnswerDto {
    id: string;
    question: string;
    answer?: unknown;
}
export declare class ContactPreferenceDto {
    method: ContactPreferenceMethod;
    value: string;
    verified?: boolean;
}
export declare class AcceptBidDto {
    bidId: string;
    answeredAt?: string;
    answers?: BidResponseAnswerDto[];
    additionalNotes?: string;
    contactPreference?: ContactPreferenceDto;
}
