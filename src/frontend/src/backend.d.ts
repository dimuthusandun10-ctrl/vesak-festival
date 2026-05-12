import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Timestamp = bigint;
export type PhotoId = bigint;
export interface Dansal {
    id: DansalId;
    status: ApprovalStatus;
    latitude: number;
    contactName: string;
    province: string;
    appreciationCount: bigint;
    date: string;
    createdAt: bigint;
    time: string;
    organizerName: string;
    likedBy: Array<Principal>;
    district: string;
    foodTypes: Array<string>;
    viewCount: bigint;
    longitude: number;
    organizerPrincipal: Principal;
    category: string;
    locationLink: string;
    contactPhone: string;
}
export interface Report {
    id: ReportId;
    status: ReportStatus;
    description?: string;
    reporterPrincipal: Principal;
    timestamp: bigint;
    targetType: ReportTargetType;
    targetId: bigint;
    reason: Variant_other_fake_inappropriate_spam;
}
export interface AddReviewRequest {
    text: string;
    reviewerName: string;
    dansalId: bigint;
    rating: bigint;
}
export type ReportId = bigint;
export interface DansalFilter {
    province?: string;
    timeStart?: string;
    district?: string;
    category?: string;
    timeEnd?: string;
    foodType?: string;
}
export interface DansalAnalytics {
    likeCount: bigint;
    appreciationCount: bigint;
    name: string;
    viewCount: bigint;
    dansalId: bigint;
}
export interface PhotoComment {
    id: PhotoCommentId;
    text: string;
    authorName: string;
    timestamp: Timestamp;
    authorPrincipal: Principal;
    photoId: bigint;
}
export interface UpdateDansalRequest {
    latitude?: number;
    contactName?: string;
    province?: string;
    date?: string;
    time?: string;
    organizerName?: string;
    district?: string;
    foodTypes?: Array<string>;
    longitude?: number;
    category?: string;
    locationLink?: string;
    contactPhone?: string;
}
export interface AddCommentRequest {
    text: string;
    authorName: string;
    dansalId: bigint;
}
export type ReviewId = bigint;
export interface AddDansalRequest {
    latitude: number;
    contactName: string;
    province: string;
    date: string;
    time: string;
    organizerName: string;
    district: string;
    foodTypes: Array<string>;
    longitude: number;
    category: string;
    locationLink: string;
    contactPhone: string;
}
export interface LikeResult {
    likeCount: bigint;
    liked: boolean;
}
export interface Review {
    id: ReviewId;
    text: string;
    reviewerName: string;
    dansalId: bigint;
    timestamp: Timestamp;
    reviewerPrincipal: Principal;
    rating: bigint;
}
export interface ApprovalNotification {
    id: bigint;
    approvedAt: bigint;
    seen: boolean;
    targetName: string;
    targetType: ReportTargetType;
    targetId: bigint;
}
export type NoteId = bigint;
export interface GalleryPhoto {
    id: PhotoId;
    status: ApprovalStatus;
    uploaderName: string;
    appreciationCount: bigint;
    likedBy: Array<Principal>;
    uploaderPrincipal: Principal;
    caption: string;
    image: ExternalBlob;
    uploadedAt: bigint;
}
export interface SubmitReportRequest {
    description?: string;
    targetType: ReportTargetType;
    targetId: bigint;
    reason: Variant_other_fake_inappropriate_spam;
}
export interface ReportNote {
    id: NoteId;
    authorId: Principal;
    createdAt: bigint;
    text: string;
    authorName: string;
    reportId: ReportId;
}
export type CommentId = bigint;
export type PhotoCommentId = bigint;
export interface Comment {
    id: CommentId;
    text: string;
    authorName: string;
    dansalId: bigint;
    timestamp: Timestamp;
    authorPrincipal: Principal;
}
export interface AddPhotoCommentRequest {
    text: string;
    authorName: string;
    photoId: bigint;
}
export interface AddPhotoRequest {
    uploaderName: string;
    caption: string;
    image: ExternalBlob;
}
export interface OrganizerPublicProfile {
    bio: string;
    principal: Principal;
    totalViews: bigint;
    name: string;
    totalDansals: bigint;
    totalLikes: bigint;
    avgRating: number;
}
export type DansalId = bigint;
export interface AddReportNoteRequest {
    text: string;
    reportId: ReportId;
}
export interface UserProfile {
    bio: string;
    principal: Principal;
    displayName: string;
    role: Role;
    bioUpdatedAt?: bigint;
    registeredAt: bigint;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ReportStatus {
    pending = "pending",
    dismissed = "dismissed",
    actioned = "actioned"
}
export enum ReportTargetType {
    dansal = "dansal",
    photo = "photo"
}
export enum Role {
    organizer = "organizer",
    admin = "admin",
    user = "user",
    superAdmin = "superAdmin"
}
export enum Variant_other_fake_inappropriate_spam {
    other = "other",
    fake = "fake",
    inappropriate = "inappropriate",
    spam = "spam"
}
export interface backendInterface {
    actionReport(id: ReportId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addComment(req: AddCommentRequest): Promise<Comment>;
    addDansal(req: AddDansalRequest): Promise<Dansal>;
    addGalleryPhoto(req: AddPhotoRequest): Promise<GalleryPhoto>;
    addPhotoComment(req: AddPhotoCommentRequest): Promise<{
        __kind__: "ok";
        ok: PhotoComment;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addReportNote(req: AddReportNoteRequest): Promise<{
        __kind__: "ok";
        ok: NoteId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addReview(req: AddReviewRequest): Promise<{
        __kind__: "ok";
        ok: Review;
    } | {
        __kind__: "err";
        err: string;
    }>;
    appreciateDansal(id: DansalId): Promise<boolean>;
    appreciatePhoto(id: PhotoId): Promise<boolean>;
    approveDansal(id: DansalId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approvePhoto(id: PhotoId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    changeAdminPin(oldPin: string, newPin: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteComment(id: CommentId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteDansal(id: DansalId): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deletePhotoComment(id: PhotoCommentId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteReportNote(noteId: NoteId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteReview(id: ReviewId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteUser(target: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    dismissReport(id: ReportId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    filterDansals(filter: DansalFilter): Promise<Array<Dansal>>;
    getApprovalNotifications(): Promise<Array<ApprovalNotification>>;
    getAverageRating(dansalId: bigint): Promise<number>;
    getComments(dansalId: bigint): Promise<Array<Comment>>;
    getDansal(id: DansalId): Promise<Dansal | null>;
    getDansals(): Promise<Array<Dansal>>;
    getGalleryPhotos(): Promise<Array<GalleryPhoto>>;
    getMyDansalAnalytics(): Promise<Array<DansalAnalytics>>;
    getMyDansals(): Promise<Array<Dansal>>;
    getMyFavorites(): Promise<Array<bigint>>;
    getMyProfile(): Promise<UserProfile | null>;
    getOrganizerProfile(principal: Principal): Promise<OrganizerPublicProfile | null>;
    getPendingDansals(): Promise<Array<Dansal>>;
    getPendingPhotos(): Promise<Array<GalleryPhoto>>;
    getPhotoComments(photoId: bigint): Promise<Array<PhotoComment>>;
    getReportNotes(reportId: ReportId): Promise<Array<ReportNote>>;
    getReviews(dansalId: bigint): Promise<Array<Review>>;
    isDansalLiked(dansalId: bigint): Promise<boolean>;
    isFavorited(dansalId: bigint): Promise<boolean>;
    likePhoto(id: PhotoId): Promise<boolean>;
    listDansals(): Promise<Array<Dansal>>;
    listPhotos(): Promise<Array<GalleryPhoto>>;
    listReports(): Promise<Array<Report>>;
    listUsers(): Promise<Array<UserProfile>>;
    markNotificationSeen(id: bigint): Promise<void>;
    registerUser(displayName: string): Promise<UserProfile>;
    rejectDansal(id: DansalId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectPhoto(id: PhotoId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setUserRole(target: Principal, role: Role): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitReport(req: SubmitReportRequest): Promise<Report>;
    toggleDansalLike(dansalId: bigint): Promise<LikeResult>;
    toggleFavorite(dansalId: bigint): Promise<boolean>;
    togglePhotoLike(photoId: bigint): Promise<LikeResult>;
    updateDansal(id: DansalId, req: UpdateDansalRequest): Promise<{
        __kind__: "ok";
        ok: Dansal;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateOrganizerBio(bio: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadPhoto(req: AddPhotoRequest): Promise<GalleryPhoto>;
    verifyAdminPin(pin: string): Promise<boolean>;
}
