import { z } from 'zod';
export declare const attachmentSchema: z.ZodObject<{
    name: z.ZodString;
    ipfsHash: z.ZodString;
    mimeType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    ipfsHash: string;
    mimeType: string;
}, {
    name: string;
    ipfsHash: string;
    mimeType: string;
}>;
export declare const requirementSchema: z.ZodObject<{
    requirement: z.ZodString;
    mandatory: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    requirement: string;
    mandatory: boolean;
}, {
    requirement: string;
    mandatory?: boolean | undefined;
}>;
export declare const verificationQuestionSchema: z.ZodObject<{
    id: z.ZodString;
    question: z.ZodString;
    type: z.ZodEnum<["text", "number", "date", "datetime", "select", "multiselect", "boolean"]>;
    required: z.ZodDefault<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    placeholder: z.ZodOptional<z.ZodString>;
    helpText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
    id: string;
    question: string;
    required: boolean;
    options?: string[] | undefined;
    placeholder?: string | undefined;
    helpText?: string | undefined;
}, {
    type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
    id: string;
    question: string;
    options?: string[] | undefined;
    required?: boolean | undefined;
    placeholder?: string | undefined;
    helpText?: string | undefined;
}>;
export declare const jobMetadataSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    requirements: z.ZodDefault<z.ZodArray<z.ZodObject<{
        requirement: z.ZodString;
        mandatory: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requirement: string;
        mandatory: boolean;
    }, {
        requirement: string;
        mandatory?: boolean | undefined;
    }>, "many">>;
    deliverableFormat: z.ZodDefault<z.ZodEnum<["JSON", "PDF", "CSV", "Image", "Document", "Code", "Other"]>>;
    additionalContext: z.ZodOptional<z.ZodString>;
    referenceLinks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ipfsHash: z.ZodString;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }, {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }>, "many">>;
    posterWallet: z.ZodString;
    createdBy: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    deadline: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    requirements: {
        requirement: string;
        mandatory: boolean;
    }[];
    deliverableFormat: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
    referenceLinks: string[];
    attachments: {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }[];
    posterWallet: string;
    createdAt: string;
    tags: string[];
    deadline: string | null;
    schemaVersion: "1.0";
    additionalContext?: string | undefined;
    createdBy?: string | undefined;
}, {
    title: string;
    description: string;
    posterWallet: string;
    createdAt: string;
    requirements?: {
        requirement: string;
        mandatory?: boolean | undefined;
    }[] | undefined;
    deliverableFormat?: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other" | undefined;
    additionalContext?: string | undefined;
    referenceLinks?: string[] | undefined;
    attachments?: {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }[] | undefined;
    createdBy?: string | undefined;
    tags?: string[] | undefined;
    deadline?: string | null | undefined;
    schemaVersion?: "1.0" | undefined;
}>;
export declare const bidMetadataSchema: z.ZodObject<{
    jobId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBigInt]>, string, string | number | bigint>;
    bidder: z.ZodObject<{
        name: z.ZodString;
        walletAddress: z.ZodString;
        specialization: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        walletAddress: string;
        specialization: string[];
    }, {
        name: string;
        walletAddress: string;
        specialization?: string[] | undefined;
    }>;
    price: z.ZodObject<{
        total: z.ZodNumber;
        breakdown: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        total: number;
        breakdown?: Record<string, number> | undefined;
    }, {
        total: number;
        breakdown?: Record<string, number> | undefined;
    }>;
    deliveryTime: z.ZodObject<{
        estimatedSeconds: z.ZodNumber;
        estimatedHumanReadable: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        estimatedSeconds: number;
        estimatedHumanReadable?: string | undefined;
    }, {
        estimatedSeconds: number;
        estimatedHumanReadable?: string | undefined;
    }>;
    methodology: z.ZodString;
    questions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        question: z.ZodString;
        type: z.ZodEnum<["text", "number", "date", "datetime", "select", "multiselect", "boolean"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        placeholder: z.ZodOptional<z.ZodString>;
        helpText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
        id: string;
        question: string;
        required: boolean;
        options?: string[] | undefined;
        placeholder?: string | undefined;
        helpText?: string | undefined;
    }, {
        type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
        id: string;
        question: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
        placeholder?: string | undefined;
        helpText?: string | undefined;
    }>, "many">>;
    previousWork: z.ZodDefault<z.ZodArray<z.ZodObject<{
        jobId: z.ZodOptional<z.ZodNumber>;
        description: z.ZodOptional<z.ZodString>;
        deliveryProof: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
    }, {
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
    }>, "many">>;
    termsAndConditions: z.ZodOptional<z.ZodString>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ipfsHash: z.ZodString;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }, {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }>, "many">>;
    createdAt: z.ZodString;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    attachments: {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }[];
    createdAt: string;
    schemaVersion: "1.0";
    jobId: string;
    bidder: {
        name: string;
        walletAddress: string;
        specialization: string[];
    };
    price: {
        total: number;
        breakdown?: Record<string, number> | undefined;
    };
    deliveryTime: {
        estimatedSeconds: number;
        estimatedHumanReadable?: string | undefined;
    };
    methodology: string;
    questions: {
        type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
        id: string;
        question: string;
        required: boolean;
        options?: string[] | undefined;
        placeholder?: string | undefined;
        helpText?: string | undefined;
    }[];
    previousWork: {
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
    }[];
    termsAndConditions?: string | undefined;
}, {
    createdAt: string;
    jobId: string | number | bigint;
    bidder: {
        name: string;
        walletAddress: string;
        specialization?: string[] | undefined;
    };
    price: {
        total: number;
        breakdown?: Record<string, number> | undefined;
    };
    deliveryTime: {
        estimatedSeconds: number;
        estimatedHumanReadable?: string | undefined;
    };
    methodology: string;
    attachments?: {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }[] | undefined;
    schemaVersion?: "1.0" | undefined;
    questions?: {
        type: "number" | "boolean" | "date" | "text" | "datetime" | "select" | "multiselect";
        id: string;
        question: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
        placeholder?: string | undefined;
        helpText?: string | undefined;
    }[] | undefined;
    previousWork?: {
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
    }[] | undefined;
    termsAndConditions?: string | undefined;
}>;
export declare const bidResponseSchema: z.ZodObject<{
    jobId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    bidId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    answeredBy: z.ZodString;
    answeredAt: z.ZodString;
    answers: z.ZodRecord<z.ZodString, z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        question: string;
        answer?: any;
    }, {
        question: string;
        answer?: any;
    }>>;
    additionalNotes: z.ZodOptional<z.ZodString>;
    contactPreference: z.ZodOptional<z.ZodObject<{
        method: z.ZodEnum<["email", "phone", "wallet", "offchain"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        method: "email" | "phone" | "wallet" | "offchain";
    }, {
        value: string;
        method: "email" | "phone" | "wallet" | "offchain";
    }>>;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    jobId: string;
    bidId: string;
    answeredBy: string;
    answeredAt: string;
    answers: Record<string, {
        question: string;
        answer?: any;
    }>;
    additionalNotes?: string | undefined;
    contactPreference?: {
        value: string;
        method: "email" | "phone" | "wallet" | "offchain";
    } | undefined;
}, {
    jobId: string | number;
    bidId: string | number;
    answeredBy: string;
    answeredAt: string;
    answers: Record<string, {
        question: string;
        answer?: any;
    }>;
    schemaVersion?: "1.0" | undefined;
    additionalNotes?: string | undefined;
    contactPreference?: {
        value: string;
        method: "email" | "phone" | "wallet" | "offchain";
    } | undefined;
}>;
export declare const deliveryProofSchema: z.ZodObject<{
    jobId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    bidId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    deliveredBy: z.ZodString;
    deliveredAt: z.ZodString;
    deliverable: z.ZodObject<{
        format: z.ZodEnum<["JSON", "PDF", "Image", "Document", "Code", "CSV", "Other"]>;
        data: z.ZodAny;
        attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            ipfsHash: z.ZodString;
            mimeType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }, {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        attachments: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[];
        format: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
        data?: any;
    }, {
        format: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
        data?: any;
        attachments?: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[] | undefined;
    }>;
    verificationProof: z.ZodDefault<z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        evidence: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        step: string;
        evidence: string;
        timestamp: string;
    }, {
        step: string;
        evidence: string;
        timestamp: string;
    }>, "many">>;
    executionLog: z.ZodDefault<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        action: z.ZodString;
        result: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        action: string;
        result: string;
    }, {
        timestamp: string;
        action: string;
        result: string;
    }>, "many">>;
    notes: z.ZodOptional<z.ZodString>;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    jobId: string;
    bidId: string;
    deliveredBy: string;
    deliveredAt: string;
    deliverable: {
        attachments: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[];
        format: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
        data?: any;
    };
    verificationProof: {
        step: string;
        evidence: string;
        timestamp: string;
    }[];
    executionLog: {
        timestamp: string;
        action: string;
        result: string;
    }[];
    notes?: string | undefined;
}, {
    jobId: string | number;
    bidId: string | number;
    deliveredBy: string;
    deliveredAt: string;
    deliverable: {
        format: "JSON" | "PDF" | "CSV" | "Image" | "Document" | "Code" | "Other";
        data?: any;
        attachments?: {
            name: string;
            ipfsHash: string;
            mimeType: string;
        }[] | undefined;
    };
    schemaVersion?: "1.0" | undefined;
    verificationProof?: {
        step: string;
        evidence: string;
        timestamp: string;
    }[] | undefined;
    executionLog?: {
        timestamp: string;
        action: string;
        result: string;
    }[] | undefined;
    notes?: string | undefined;
}>;
export declare const disputeEvidenceSchema: z.ZodObject<{
    disputeId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    jobId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    submittedBy: z.ZodString;
    submittedByRole: z.ZodEnum<["poster", "agent"]>;
    submittedAt: z.ZodString;
    evidenceType: z.ZodEnum<["initial_complaint", "counter_evidence", "supporting_document", "screenshot", "communication_log"]>;
    title: z.ZodString;
    description: z.ZodString;
    claims: z.ZodDefault<z.ZodArray<z.ZodObject<{
        claim: z.ZodString;
        supportingEvidence: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        claim: string;
        supportingEvidence?: string | undefined;
    }, {
        claim: string;
        supportingEvidence?: string | undefined;
    }>, "many">>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        ipfsHash: z.ZodString;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }, {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }>, "many">>;
    requestedResolution: z.ZodOptional<z.ZodEnum<["full_refund", "partial_refund", "redelivery", "payment_release"]>>;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    attachments: {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }[];
    schemaVersion: "1.0";
    jobId: string;
    disputeId: string;
    submittedBy: string;
    submittedByRole: "poster" | "agent";
    submittedAt: string;
    evidenceType: "initial_complaint" | "counter_evidence" | "supporting_document" | "screenshot" | "communication_log";
    claims: {
        claim: string;
        supportingEvidence?: string | undefined;
    }[];
    requestedResolution?: "full_refund" | "partial_refund" | "redelivery" | "payment_release" | undefined;
}, {
    title: string;
    description: string;
    jobId: string | number;
    disputeId: string | number;
    submittedBy: string;
    submittedByRole: "poster" | "agent";
    submittedAt: string;
    evidenceType: "initial_complaint" | "counter_evidence" | "supporting_document" | "screenshot" | "communication_log";
    attachments?: {
        name: string;
        ipfsHash: string;
        mimeType: string;
    }[] | undefined;
    schemaVersion?: "1.0" | undefined;
    claims?: {
        claim: string;
        supportingEvidence?: string | undefined;
    }[] | undefined;
    requestedResolution?: "full_refund" | "partial_refund" | "redelivery" | "payment_release" | undefined;
}>;
export declare const disputeResolutionSchema: z.ZodObject<{
    disputeId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    jobId: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>;
    resolvedBy: z.ZodString;
    resolvedAt: z.ZodString;
    decision: z.ZodEnum<["RESOLVED_USER", "RESOLVED_AGENT", "DISMISSED"]>;
    decisionLabel: z.ZodOptional<z.ZodString>;
    reasoning: z.ZodString;
    evidenceReviewed: z.ZodDefault<z.ZodArray<z.ZodObject<{
        evidenceId: z.ZodOptional<z.ZodString>;
        submittedBy: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        submittedBy?: string | undefined;
        evidenceId?: string | undefined;
        summary?: string | undefined;
    }, {
        submittedBy?: string | undefined;
        evidenceId?: string | undefined;
        summary?: string | undefined;
    }>, "many">>;
    findings: z.ZodDefault<z.ZodArray<z.ZodObject<{
        finding: z.ZodString;
        favoredParty: z.ZodEnum<["user", "agent", "neutral"]>;
    }, "strip", z.ZodTypeAny, {
        finding: string;
        favoredParty: "agent" | "user" | "neutral";
    }, {
        finding: string;
        favoredParty: "agent" | "user" | "neutral";
    }>, "many">>;
    actionTaken: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["full_refund", "partial_refund", "payment_release", "no_action"]>;
        amount: z.ZodOptional<z.ZodNumber>;
        reputationImpact: z.ZodOptional<z.ZodObject<{
            agent: z.ZodOptional<z.ZodString>;
            user: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            agent?: string | undefined;
            user?: string | undefined;
        }, {
            agent?: string | undefined;
            user?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "full_refund" | "partial_refund" | "payment_release" | "no_action";
        amount?: number | undefined;
        reputationImpact?: {
            agent?: string | undefined;
            user?: string | undefined;
        } | undefined;
    }, {
        type: "full_refund" | "partial_refund" | "payment_release" | "no_action";
        amount?: number | undefined;
        reputationImpact?: {
            agent?: string | undefined;
            user?: string | undefined;
        } | undefined;
    }>>;
    recommendations: z.ZodOptional<z.ZodString>;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: "1.0";
    jobId: string;
    disputeId: string;
    resolvedBy: string;
    resolvedAt: string;
    decision: "RESOLVED_USER" | "RESOLVED_AGENT" | "DISMISSED";
    reasoning: string;
    evidenceReviewed: {
        submittedBy?: string | undefined;
        evidenceId?: string | undefined;
        summary?: string | undefined;
    }[];
    findings: {
        finding: string;
        favoredParty: "agent" | "user" | "neutral";
    }[];
    decisionLabel?: string | undefined;
    actionTaken?: {
        type: "full_refund" | "partial_refund" | "payment_release" | "no_action";
        amount?: number | undefined;
        reputationImpact?: {
            agent?: string | undefined;
            user?: string | undefined;
        } | undefined;
    } | undefined;
    recommendations?: string | undefined;
}, {
    jobId: string | number;
    disputeId: string | number;
    resolvedBy: string;
    resolvedAt: string;
    decision: "RESOLVED_USER" | "RESOLVED_AGENT" | "DISMISSED";
    reasoning: string;
    schemaVersion?: "1.0" | undefined;
    decisionLabel?: string | undefined;
    evidenceReviewed?: {
        submittedBy?: string | undefined;
        evidenceId?: string | undefined;
        summary?: string | undefined;
    }[] | undefined;
    findings?: {
        finding: string;
        favoredParty: "agent" | "user" | "neutral";
    }[] | undefined;
    actionTaken?: {
        type: "full_refund" | "partial_refund" | "payment_release" | "no_action";
        amount?: number | undefined;
        reputationImpact?: {
            agent?: string | undefined;
            user?: string | undefined;
        } | undefined;
    } | undefined;
    recommendations?: string | undefined;
}>;
export declare const agentProfileSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    specializations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        experienceYears: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        description?: string | undefined;
        experienceYears?: number | undefined;
    }, {
        category: string;
        description?: string | undefined;
        experienceYears?: number | undefined;
    }>, "many">>;
    pricingGuidelines: z.ZodOptional<z.ZodObject<{
        typical: z.ZodOptional<z.ZodString>;
        factors: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        factors: string[];
        typical?: string | undefined;
    }, {
        typical?: string | undefined;
        factors?: string[] | undefined;
    }>>;
    portfolio: z.ZodDefault<z.ZodArray<z.ZodObject<{
        jobId: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        deliveryProof: z.ZodOptional<z.ZodString>;
        rating: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
        rating?: number | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
        rating?: number | undefined;
    }>, "many">>;
    languages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    availability: z.ZodOptional<z.ZodObject<{
        timezone: z.ZodOptional<z.ZodString>;
        typicalResponseTime: z.ZodOptional<z.ZodString>;
        workingHours: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timezone?: string | undefined;
        typicalResponseTime?: string | undefined;
        workingHours?: string | undefined;
    }, {
        timezone?: string | undefined;
        typicalResponseTime?: string | undefined;
        workingHours?: string | undefined;
    }>>;
    contactPreferences: z.ZodOptional<z.ZodObject<{
        offchainContact: z.ZodOptional<z.ZodBoolean>;
        methods: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        methods: string[];
        offchainContact?: boolean | undefined;
    }, {
        offchainContact?: boolean | undefined;
        methods?: string[] | undefined;
    }>>;
    policies: z.ZodOptional<z.ZodObject<{
        refundPolicy: z.ZodOptional<z.ZodString>;
        revisionPolicy: z.ZodOptional<z.ZodString>;
        communicationPolicy: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        refundPolicy?: string | undefined;
        revisionPolicy?: string | undefined;
        communicationPolicy?: string | undefined;
    }, {
        refundPolicy?: string | undefined;
        revisionPolicy?: string | undefined;
        communicationPolicy?: string | undefined;
    }>>;
    createdAt: z.ZodString;
    schemaVersion: z.ZodDefault<z.ZodLiteral<"1.0">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    createdAt: string;
    schemaVersion: "1.0";
    capabilities: string[];
    specializations: {
        category: string;
        description?: string | undefined;
        experienceYears?: number | undefined;
    }[];
    portfolio: {
        title?: string | undefined;
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
        rating?: number | undefined;
    }[];
    languages: string[];
    avatar?: string | undefined;
    pricingGuidelines?: {
        factors: string[];
        typical?: string | undefined;
    } | undefined;
    availability?: {
        timezone?: string | undefined;
        typicalResponseTime?: string | undefined;
        workingHours?: string | undefined;
    } | undefined;
    contactPreferences?: {
        methods: string[];
        offchainContact?: boolean | undefined;
    } | undefined;
    policies?: {
        refundPolicy?: string | undefined;
        revisionPolicy?: string | undefined;
        communicationPolicy?: string | undefined;
    } | undefined;
}, {
    name: string;
    description: string;
    createdAt: string;
    schemaVersion?: "1.0" | undefined;
    avatar?: string | undefined;
    capabilities?: string[] | undefined;
    specializations?: {
        category: string;
        description?: string | undefined;
        experienceYears?: number | undefined;
    }[] | undefined;
    pricingGuidelines?: {
        typical?: string | undefined;
        factors?: string[] | undefined;
    } | undefined;
    portfolio?: {
        title?: string | undefined;
        description?: string | undefined;
        jobId?: number | undefined;
        deliveryProof?: string | undefined;
        rating?: number | undefined;
    }[] | undefined;
    languages?: string[] | undefined;
    availability?: {
        timezone?: string | undefined;
        typicalResponseTime?: string | undefined;
        workingHours?: string | undefined;
    } | undefined;
    contactPreferences?: {
        offchainContact?: boolean | undefined;
        methods?: string[] | undefined;
    } | undefined;
    policies?: {
        refundPolicy?: string | undefined;
        revisionPolicy?: string | undefined;
        communicationPolicy?: string | undefined;
    } | undefined;
}>;
