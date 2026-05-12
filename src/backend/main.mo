import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import DansalTypes "types/dansal";
import GalleryTypes "types/gallery";
import AdminTypes "types/admin";
import SocialTypes "types/social";
import DansalLib "lib/dansal";
import GalleryLib "lib/gallery";
import DansalApi "mixins/dansal-api";
import GalleryApi "mixins/gallery-api";
import AdminApi "mixins/admin-api";
import SocialApi "mixins/social-api";






actor {
  // Stable var for super admin — set to the first registered user's principal
  let superAdminState = { var SUPER_ADMIN_PRINCIPAL : Text = "" };

  // Hardcoded fallback super-admin principal (can replace before deployment)
  let FALLBACK_SUPER_ADMIN : Principal = Principal.fromText("2vxsx-fae");

  // Dansal state
  let dansals = List.empty<DansalTypes.Dansal>();
  let dansalState = { var nextId : Nat = 1 };

  // Gallery state
  let photos = List.empty<GalleryTypes.GalleryPhoto>();
  let galleryState = { var nextId : Nat = 1 };

  // Admin state
  let profiles = Map.empty<Principal, AdminTypes.UserProfile>();
  let reports = List.empty<AdminTypes.Report>();
  let reportState = { var nextId : Nat = 1 };
  let notes = List.empty<AdminTypes.ReportNote>();
  let noteState = { var nextId : Nat = 1 };
  let pinState = { var pin : Text = "0000"; var pinUpdatedAt : Int = 0 };
  let notifications = Map.empty<Principal, List.List<AdminTypes.ApprovalNotification>>();

  // Social state
  let dansalLikes = Map.empty<Nat, Set.Set<Principal>>();
  let photoLikes = Map.empty<Nat, Set.Set<Principal>>();
  let comments = List.empty<SocialTypes.Comment>();
  let commentState = { var nextId : Nat = 1 };
  let reviews = List.empty<SocialTypes.Review>();
  let reviewState = { var nextId : Nat = 1 };
  let favorites = Map.empty<Principal, List.List<Nat>>();
  let viewCounts = Map.empty<Nat, Nat>();
  let photoComments = List.empty<SocialTypes.PhotoComment>();
  let photoCommentState = { var nextId : Nat = 1 };

  // Seed initial data on first start
  DansalLib.seedDansals(dansals, dansalState);
  GalleryLib.seedPhotos(photos, galleryState);

  // Mixins
  include MixinObjectStorage();
  include DansalApi(dansals, dansalState, viewCounts);
  include GalleryApi(photos, galleryState);
  include AdminApi(profiles, reports, reportState, notes, noteState, pinState, notifications, dansals, photos, FALLBACK_SUPER_ADMIN, superAdminState);
  include SocialApi(dansalLikes, photoLikes, comments, commentState, reviews, reviewState, favorites, viewCounts, dansals, photoComments, photoCommentState);
};
