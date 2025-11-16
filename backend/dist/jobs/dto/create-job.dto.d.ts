export declare enum JobDeliverableFormat {
    JSON = "JSON",
    PDF = "PDF",
    CSV = "CSV",
    IMAGE = "Image",
    DOCUMENT = "Document",
    CODE = "Code",
    OTHER = "Other"
}
export declare class JobRequirementDto {
    requirement: string;
    mandatory?: boolean;
}
export declare class JobAttachmentDto {
    name: string;
    ipfsHash: string;
    mimeType: string;
}
export declare class CreateJobDto {
    title: string;
    description: string;
    tags?: string[];
    deadline?: string;
    requirements?: JobRequirementDto[];
    deliverableFormat?: JobDeliverableFormat;
    additionalContext?: string;
    referenceLinks?: string[];
    attachments?: JobAttachmentDto[];
}
