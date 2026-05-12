// Public API mixin for Social domain
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import SocialLib "../lib/social";
import SocialTypes "../types/social";
import Principal "mo:core/Principal";
import DansalTypes "../types/dansal";

mixin (
  dansalLikes : Map.Map<Nat, Set.Set<Principal>>,
  photoLikes : Map.Map<Nat, Set.Set<Principal>>,
  comments : List.List<SocialTypes.Comment>,
  commentState : { var nextId : Nat },
  reviews : List.List<SocialTypes.Review>,
  reviewState : { var nextId : Nat },
  favorites : Map.Map<Principal, List.List<Nat>>,
  viewCounts : Map.Map<Nat, Nat>,
  dansals : List.List<DansalTypes.Dansal>,
  photoComments : List.List<SocialTypes.PhotoComment>,
  photoCommentState : { var nextId : Nat },
) {
  // ----- Likes -----

  public shared ({ caller }) func toggleDansalLike(
    dansalId : Nat,
  ) : async SocialTypes.LikeResult {
    SocialLib.toggleDansalLike(dansalLikes, dansalId, caller);
  };

  public shared ({ caller }) func togglePhotoLike(
    photoId : Nat,
  ) : async SocialTypes.LikeResult {
    SocialLib.togglePhotoLike(photoLikes, photoId, caller);
  };

  public shared query ({ caller }) func isDansalLiked(
    dansalId : Nat,
  ) : async Bool {
    SocialLib.isDansalLikedByUser(dansalLikes, dansalId, caller);
  };

  // ----- Comments -----

  public shared ({ caller }) func addComment(
    req : SocialTypes.AddCommentRequest,
  ) : async SocialTypes.Comment {
    SocialLib.addComment(comments, commentState, caller, req);
  };

  public query func getComments(
    dansalId : Nat,
  ) : async [SocialTypes.Comment] {
    SocialLib.getComments(comments, dansalId);
  };

  public shared ({ caller }) func deleteComment(
    id : SocialTypes.CommentId,
  ) : async { #ok; #err : Text } {
    SocialLib.deleteComment(comments, caller, id);
  };

  // ----- Reviews -----

  public shared ({ caller }) func addReview(
    req : SocialTypes.AddReviewRequest,
  ) : async { #ok : SocialTypes.Review; #err : Text } {
    SocialLib.addReview(reviews, reviewState, caller, req);
  };

  public query func getReviews(
    dansalId : Nat,
  ) : async [SocialTypes.Review] {
    SocialLib.getReviews(reviews, dansalId);
  };

  public shared ({ caller }) func deleteReview(
    id : SocialTypes.ReviewId,
  ) : async { #ok; #err : Text } {
    SocialLib.deleteReview(reviews, caller, id);
  };

  public query func getAverageRating(
    dansalId : Nat,
  ) : async Float {
    SocialLib.getAverageRating(reviews, dansalId);
  };

  // ----- Favorites -----

  public shared ({ caller }) func toggleFavorite(
    dansalId : Nat,
  ) : async Bool {
    SocialLib.toggleFavorite(favorites, caller, dansalId);
  };

  public shared query ({ caller }) func getMyFavorites() : async [Nat] {
    SocialLib.getFavorites(favorites, caller);
  };

  public shared query ({ caller }) func isFavorited(
    dansalId : Nat,
  ) : async Bool {
    SocialLib.isFavorited(favorites, caller, dansalId);
  };

  // ----- Analytics -----

  public shared query ({ caller }) func getMyDansalAnalytics() : async [SocialTypes.DansalAnalytics] {
    SocialLib.getMyAnalytics(dansals, caller, viewCounts, dansalLikes);
  };

  // ----- Photo Comments -----

  public shared ({ caller }) func addPhotoComment(
    req : SocialTypes.AddPhotoCommentRequest,
  ) : async { #ok : SocialTypes.PhotoComment; #err : Text } {
    SocialLib.addPhotoComment(photoComments, photoCommentState, caller, req);
  };

  public query func getPhotoComments(
    photoId : Nat,
  ) : async [SocialTypes.PhotoComment] {
    SocialLib.getPhotoComments(photoComments, photoId);
  };

  public shared ({ caller }) func deletePhotoComment(
    id : SocialTypes.PhotoCommentId,
  ) : async { #ok; #err : Text } {
    SocialLib.deletePhotoComment(photoComments, caller, id);
  };
};
