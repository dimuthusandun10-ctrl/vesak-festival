export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ReportStatus = "pending" | "dismissed" | "actioned";
export type ReportTargetType = "dansal" | "photo";
export type Role = "user" | "organizer" | "admin" | "superAdmin";
export type ReportReason = "spam" | "fake" | "inappropriate" | "other";

export interface UserProfile {
  principal: string;
  role: Role;
  displayName: string;
  registeredAt: bigint;
}

export interface Report {
  id: bigint;
  targetId: bigint;
  targetType: ReportTargetType;
  reason: ReportReason;
  description?: string;
  timestamp: bigint;
  status: ReportStatus;
  reporterPrincipal: string;
}

export interface Comment {
  id: bigint;
  dansalId: bigint;
  authorName: string;
  text: string;
  timestamp: bigint;
  authorPrincipal?: string;
}
export interface PhotoComment {
  id: bigint;
  photoId: bigint;
  authorName: string;
  text: string;
  timestamp: bigint;
  authorPrincipal?: string;
}

export interface Review {
  id: bigint;
  dansalId: bigint;
  reviewerName: string;
  rating: bigint;
  text: string;
  timestamp: bigint;
  reviewerPrincipal?: string;
}

export interface DansalAnalytics {
  dansalId: bigint;
  name: string;
  viewCount: bigint;
  likeCount: bigint;
  appreciationCount: bigint;
}

export interface LikeResult {
  liked: boolean;
  likeCount: bigint;
}

export interface Dansal {
  id: bigint;
  organizerName: string;
  contactName: string;
  contactPhone: string;
  foodTypes: string[];
  date: string;
  time: string;
  locationLink: string;
  appreciationCount: bigint;
  createdAt: bigint;
  organizerPrincipal: string;
  latitude: number;
  longitude: number;
  province: string;
  district: string;
  category: string;
  status: ApprovalStatus;
  likeCount: bigint;
  viewCount: bigint;
  isFavorited?: boolean;
}

export interface AddDansalRequest {
  organizerName: string;
  contactName: string;
  contactPhone: string;
  foodTypes: string[];
  date: string;
  time: string;
  locationLink: string;
  latitude: number;
  longitude: number;
  province: string;
  district: string;
  category: string;
}

export interface UpdateDansalRequest {
  organizerName?: string;
  contactName?: string;
  contactPhone?: string;
  foodTypes?: string[];
  date?: string;
  time?: string;
  locationLink?: string;
  latitude?: number;
  longitude?: number;
  province?: string;
  district?: string;
  category?: string;
}

export interface DansalFilter {
  province?: string;
  district?: string;
  category?: string;
  foodType?: string;
  timeStart?: string;
  timeEnd?: string;
}

export interface GalleryPhoto {
  id: bigint;
  uploaderName: string;
  caption: string;
  image: { getDirectURL(): string };
  appreciationCount: bigint;
  uploadedAt: bigint;
  status: ApprovalStatus;
  likeCount: bigint;
}

export interface AddPhotoRequest {
  uploaderName: string;
  caption: string;
  image: unknown;
}

export interface ReportNote {
  id: bigint;
  reportId: bigint;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: bigint;
}

export interface OrganizerPublicProfile {
  principal: string;
  name: string;
  bio: string;
  avgRating: number;
  totalDansals: bigint;
  totalViews: bigint;
  totalLikes: bigint;
}

export interface ApprovalNotification {
  id: bigint;
  targetType: string;
  targetId: bigint;
  targetName: string;
  approvedAt: bigint;
  seen: boolean;
}

export type TabId =
  | "home"
  | "dansals"
  | "gallery"
  | "favorites"
  | "account"
  | "admin"
  | "organizer-profile";
