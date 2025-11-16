"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentProfileSchema = exports.disputeResolutionSchema = exports.disputeEvidenceSchema = exports.deliveryProofSchema = exports.bidResponseSchema = exports.bidMetadataSchema = exports.jobMetadataSchema = exports.verificationQuestionSchema = exports.requirementSchema = exports.attachmentSchema = void 0;
const zod_1 = require("zod");
const schemaVersionField = {
    schemaVersion: zod_1.z.literal('1.0').default('1.0'),
};
exports.attachmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    ipfsHash: zod_1.z.string().min(1),
    mimeType: zod_1.z.string().min(1),
});
exports.requirementSchema = zod_1.z.object({
    requirement: zod_1.z.string().min(1),
    mandatory: zod_1.z.boolean().default(false),
});
exports.verificationQuestionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    question: zod_1.z.string().min(1),
    type: zod_1.z.enum([
        'text',
        'number',
        'date',
        'datetime',
        'select',
        'multiselect',
        'boolean',
    ]),
    required: zod_1.z.boolean().default(false),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    placeholder: zod_1.z.string().optional(),
    helpText: zod_1.z.string().optional(),
});
exports.jobMetadataSchema = zod_1.z.object({
    ...schemaVersionField,
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    requirements: zod_1.z.array(exports.requirementSchema).default([]),
    deliverableFormat: zod_1.z
        .enum(['JSON', 'PDF', 'CSV', 'Image', 'Document', 'Code', 'Other'])
        .default('JSON'),
    additionalContext: zod_1.z.string().optional(),
    referenceLinks: zod_1.z.array(zod_1.z.string().url()).default([]),
    attachments: zod_1.z.array(exports.attachmentSchema).default([]),
    posterWallet: zod_1.z.string().min(1),
    createdBy: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().datetime({ offset: true }),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    deadline: zod_1.z.string().nullable().default(null),
});
exports.bidMetadataSchema = zod_1.z.object({
    ...schemaVersionField,
    jobId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number(), zod_1.z.bigint()])
        .transform((val) => val.toString()),
    bidder: zod_1.z.object({
        name: zod_1.z.string().min(1),
        walletAddress: zod_1.z.string().min(1),
        specialization: zod_1.z.array(zod_1.z.string()).default([]),
    }),
    price: zod_1.z.object({
        total: zod_1.z.number().nonnegative(),
        breakdown: zod_1.z.record(zod_1.z.number()).optional(),
    }),
    deliveryTime: zod_1.z.object({
        estimatedSeconds: zod_1.z.number().nonnegative(),
        estimatedHumanReadable: zod_1.z.string().optional(),
    }),
    methodology: zod_1.z.string().min(1),
    questions: zod_1.z.array(exports.verificationQuestionSchema).default([]),
    previousWork: zod_1.z
        .array(zod_1.z.object({
        jobId: zod_1.z.number().optional(),
        description: zod_1.z.string().optional(),
        deliveryProof: zod_1.z.string().optional(),
    }))
        .default([]),
    termsAndConditions: zod_1.z.string().optional(),
    attachments: zod_1.z.array(exports.attachmentSchema).default([]),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
exports.bidResponseSchema = zod_1.z.object({
    ...schemaVersionField,
    jobId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((val) => val.toString()),
    bidId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((val) => val.toString()),
    answeredBy: zod_1.z.string().min(1),
    answeredAt: zod_1.z.string().datetime({ offset: true }),
    answers: zod_1.z.record(zod_1.z.object({
        question: zod_1.z.string().min(1),
        answer: zod_1.z.any(),
    })),
    additionalNotes: zod_1.z.string().optional(),
    contactPreference: zod_1.z
        .object({
        method: zod_1.z.enum(['email', 'phone', 'wallet', 'offchain']),
        value: zod_1.z.string().min(1),
    })
        .optional(),
});
exports.deliveryProofSchema = zod_1.z.object({
    ...schemaVersionField,
    jobId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((val) => val.toString()),
    bidId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((val) => val.toString()),
    deliveredBy: zod_1.z.string().min(1),
    deliveredAt: zod_1.z.string().datetime({ offset: true }),
    deliverable: zod_1.z.object({
        format: zod_1.z.enum([
            'JSON',
            'PDF',
            'Image',
            'Document',
            'Code',
            'CSV',
            'Other',
        ]),
        data: zod_1.z.any(),
        attachments: zod_1.z.array(exports.attachmentSchema).default([]),
    }),
    verificationProof: zod_1.z
        .array(zod_1.z.object({
        step: zod_1.z.string().min(1),
        evidence: zod_1.z.string().min(1),
        timestamp: zod_1.z.string().min(1),
    }))
        .default([]),
    executionLog: zod_1.z
        .array(zod_1.z.object({
        timestamp: zod_1.z.string().min(1),
        action: zod_1.z.string().min(1),
        result: zod_1.z.string().min(1),
    }))
        .default([]),
    notes: zod_1.z.string().optional(),
});
exports.disputeEvidenceSchema = zod_1.z.object({
    ...schemaVersionField,
    disputeId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform((val) => val.toString()),
    jobId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((val) => val.toString()),
    submittedBy: zod_1.z.string().min(1),
    submittedByRole: zod_1.z.enum(['poster', 'agent']),
    submittedAt: zod_1.z.string().datetime({ offset: true }),
    evidenceType: zod_1.z.enum([
        'initial_complaint',
        'counter_evidence',
        'supporting_document',
        'screenshot',
        'communication_log',
    ]),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    claims: zod_1.z
        .array(zod_1.z.object({
        claim: zod_1.z.string().min(1),
        supportingEvidence: zod_1.z.string().optional(),
    }))
        .default([]),
    attachments: zod_1.z.array(exports.attachmentSchema).default([]),
    requestedResolution: zod_1.z
        .enum(['full_refund', 'partial_refund', 'redelivery', 'payment_release'])
        .optional(),
});
exports.disputeResolutionSchema = zod_1.z.object({
    ...schemaVersionField,
    disputeId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform((val) => val.toString()),
    jobId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((val) => val.toString()),
    resolvedBy: zod_1.z.string().min(1),
    resolvedAt: zod_1.z.string().datetime({ offset: true }),
    decision: zod_1.z.enum(['RESOLVED_USER', 'RESOLVED_AGENT', 'DISMISSED']),
    decisionLabel: zod_1.z.string().optional(),
    reasoning: zod_1.z.string().min(1),
    evidenceReviewed: zod_1.z
        .array(zod_1.z.object({
        evidenceId: zod_1.z.string().optional(),
        submittedBy: zod_1.z.string().optional(),
        summary: zod_1.z.string().optional(),
    }))
        .default([]),
    findings: zod_1.z
        .array(zod_1.z.object({
        finding: zod_1.z.string().min(1),
        favoredParty: zod_1.z.enum(['user', 'agent', 'neutral']),
    }))
        .default([]),
    actionTaken: zod_1.z
        .object({
        type: zod_1.z.enum([
            'full_refund',
            'partial_refund',
            'payment_release',
            'no_action',
        ]),
        amount: zod_1.z.number().optional(),
        reputationImpact: zod_1.z
            .object({
            agent: zod_1.z.string().optional(),
            user: zod_1.z.string().optional(),
        })
            .optional(),
    })
        .optional(),
    recommendations: zod_1.z.string().optional(),
});
exports.agentProfileSchema = zod_1.z.object({
    ...schemaVersionField,
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    avatar: zod_1.z.string().optional(),
    capabilities: zod_1.z.array(zod_1.z.string()).default([]),
    specializations: zod_1.z
        .array(zod_1.z.object({
        category: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        experienceYears: zod_1.z.number().optional(),
    }))
        .default([]),
    pricingGuidelines: zod_1.z
        .object({
        typical: zod_1.z.string().optional(),
        factors: zod_1.z.array(zod_1.z.string()).default([]),
    })
        .optional(),
    portfolio: zod_1.z
        .array(zod_1.z.object({
        jobId: zod_1.z.number().optional(),
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        deliveryProof: zod_1.z.string().optional(),
        rating: zod_1.z.number().optional(),
    }))
        .default([]),
    languages: zod_1.z.array(zod_1.z.string()).default([]),
    availability: zod_1.z
        .object({
        timezone: zod_1.z.string().optional(),
        typicalResponseTime: zod_1.z.string().optional(),
        workingHours: zod_1.z.string().optional(),
    })
        .optional(),
    contactPreferences: zod_1.z
        .object({
        offchainContact: zod_1.z.boolean().optional(),
        methods: zod_1.z.array(zod_1.z.string()).default([]),
    })
        .optional(),
    policies: zod_1.z
        .object({
        refundPolicy: zod_1.z.string().optional(),
        revisionPolicy: zod_1.z.string().optional(),
        communicationPolicy: zod_1.z.string().optional(),
    })
        .optional(),
    createdAt: zod_1.z.string().datetime({ offset: true }),
});
//# sourceMappingURL=metadata.schemas.js.map