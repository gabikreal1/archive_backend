import { z } from 'zod';

const schemaVersionField = {
  schemaVersion: z.literal('1.0').default('1.0'),
};

export const attachmentSchema = z.object({
  name: z.string().min(1),
  ipfsHash: z.string().min(1),
  mimeType: z.string().min(1),
});

export const requirementSchema = z.object({
  requirement: z.string().min(1),
  mandatory: z.boolean().default(false),
});

export const verificationQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  type: z.enum([
    'text',
    'number',
    'date',
    'datetime',
    'select',
    'multiselect',
    'boolean',
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
});

export const jobMetadataSchema = z.object({
  ...schemaVersionField,
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.array(requirementSchema).default([]),
  deliverableFormat: z
    .enum(['JSON', 'PDF', 'CSV', 'Image', 'Document', 'Code', 'Other'])
    .default('JSON'),
  additionalContext: z.string().optional(),
  referenceLinks: z.array(z.string().url()).default([]),
  attachments: z.array(attachmentSchema).default([]),
  posterWallet: z.string().min(1),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  tags: z.array(z.string()).default([]),
  deadline: z.string().nullable().default(null),
});

export const bidMetadataSchema = z.object({
  ...schemaVersionField,
  jobId: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((val) => val.toString()),
  bidder: z.object({
    name: z.string().min(1),
    walletAddress: z.string().min(1),
    specialization: z.array(z.string()).default([]),
  }),
  price: z.object({
    total: z.number().nonnegative(),
    breakdown: z.record(z.number()).optional(),
  }),
  deliveryTime: z.object({
    estimatedSeconds: z.number().nonnegative(),
    estimatedHumanReadable: z.string().optional(),
  }),
  methodology: z.string().min(1),
  questions: z.array(verificationQuestionSchema).default([]),
  previousWork: z
    .array(
      z.object({
        jobId: z.number().optional(),
        description: z.string().optional(),
        deliveryProof: z.string().optional(),
      }),
    )
    .default([]),
  termsAndConditions: z.string().optional(),
  attachments: z.array(attachmentSchema).default([]),
  createdAt: z.string().datetime({ offset: true }),
});

export const bidResponseSchema = z.object({
  ...schemaVersionField,
  jobId: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  bidId: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  answeredBy: z.string().min(1),
  answeredAt: z.string().datetime({ offset: true }),
  answers: z.record(
    z.object({
      question: z.string().min(1),
      answer: z.any(),
    }),
  ),
  additionalNotes: z.string().optional(),
  contactPreference: z
    .object({
      method: z.enum(['email', 'phone', 'wallet', 'offchain']),
      value: z.string().min(1),
    })
    .optional(),
});

export const deliveryProofSchema = z.object({
  ...schemaVersionField,
  jobId: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  bidId: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  deliveredBy: z.string().min(1),
  deliveredAt: z.string().datetime({ offset: true }),
  deliverable: z.object({
    format: z.enum([
      'JSON',
      'PDF',
      'Image',
      'Document',
      'Code',
      'CSV',
      'Other',
    ]),
    data: z.any(),
    attachments: z.array(attachmentSchema).default([]),
  }),
  verificationProof: z
    .array(
      z.object({
        step: z.string().min(1),
        evidence: z.string().min(1),
        timestamp: z.string().min(1),
      }),
    )
    .default([]),
  executionLog: z
    .array(
      z.object({
        timestamp: z.string().min(1),
        action: z.string().min(1),
        result: z.string().min(1),
      }),
    )
    .default([]),
  notes: z.string().optional(),
});

export const disputeEvidenceSchema = z.object({
  ...schemaVersionField,
  disputeId: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString()),
  jobId: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  submittedBy: z.string().min(1),
  submittedByRole: z.enum(['poster', 'agent']),
  submittedAt: z.string().datetime({ offset: true }),
  evidenceType: z.enum([
    'initial_complaint',
    'counter_evidence',
    'supporting_document',
    'screenshot',
    'communication_log',
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  claims: z
    .array(
      z.object({
        claim: z.string().min(1),
        supportingEvidence: z.string().optional(),
      }),
    )
    .default([]),
  attachments: z.array(attachmentSchema).default([]),
  requestedResolution: z
    .enum(['full_refund', 'partial_refund', 'redelivery', 'payment_release'])
    .optional(),
});

export const disputeResolutionSchema = z.object({
  ...schemaVersionField,
  disputeId: z
    .union([z.string(), z.number()])
    .transform((val) => val.toString()),
  jobId: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  resolvedBy: z.string().min(1),
  resolvedAt: z.string().datetime({ offset: true }),
  decision: z.enum(['RESOLVED_USER', 'RESOLVED_AGENT', 'DISMISSED']),
  decisionLabel: z.string().optional(),
  reasoning: z.string().min(1),
  evidenceReviewed: z
    .array(
      z.object({
        evidenceId: z.string().optional(),
        submittedBy: z.string().optional(),
        summary: z.string().optional(),
      }),
    )
    .default([]),
  findings: z
    .array(
      z.object({
        finding: z.string().min(1),
        favoredParty: z.enum(['user', 'agent', 'neutral']),
      }),
    )
    .default([]),
  actionTaken: z
    .object({
      type: z.enum([
        'full_refund',
        'partial_refund',
        'payment_release',
        'no_action',
      ]),
      amount: z.number().optional(),
      reputationImpact: z
        .object({
          agent: z.string().optional(),
          user: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  recommendations: z.string().optional(),
});

export const agentProfileSchema = z.object({
  ...schemaVersionField,
  name: z.string().min(1),
  description: z.string().min(1),
  avatar: z.string().optional(),
  capabilities: z.array(z.string()).default([]),
  specializations: z
    .array(
      z.object({
        category: z.string().min(1),
        description: z.string().optional(),
        experienceYears: z.number().optional(),
      }),
    )
    .default([]),
  pricingGuidelines: z
    .object({
      typical: z.string().optional(),
      factors: z.array(z.string()).default([]),
    })
    .optional(),
  portfolio: z
    .array(
      z.object({
        jobId: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        deliveryProof: z.string().optional(),
        rating: z.number().optional(),
      }),
    )
    .default([]),
  languages: z.array(z.string()).default([]),
  availability: z
    .object({
      timezone: z.string().optional(),
      typicalResponseTime: z.string().optional(),
      workingHours: z.string().optional(),
    })
    .optional(),
  contactPreferences: z
    .object({
      offchainContact: z.boolean().optional(),
      methods: z.array(z.string()).default([]),
    })
    .optional(),
  policies: z
    .object({
      refundPolicy: z.string().optional(),
      revisionPolicy: z.string().optional(),
      communicationPolicy: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime({ offset: true }),
});
