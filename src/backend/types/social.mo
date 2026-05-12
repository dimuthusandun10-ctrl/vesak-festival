// Social domain types: comments, reviews, favorites, and like-toggle responses
import CommonTypes "common";
module {
  public type Timestamp = CommonTypes.Timestamp;

  public type CommentId = Nat;

  public type Comment = {
    id : CommentId;
    dansalId : Nat;
    authorPrincipal : Principal;
    authorName : Text;
    text : Text;
    timestamp : Timestamp;
  };

  public type AddCommentRequest = {
    dansalId : Nat;
    authorName : Text;
    text : Text;
  };

  public type PhotoCommentId = Nat;

  public type PhotoComment = {
    id : PhotoCommentId;
    photoId : Nat;
    authorPrincipal : Principal;
    authorName : Text;
    text : Text;
    timestamp : Timestamp;
  };

  public type AddPhotoCommentRequest = {
    photoId : Nat;
    authorName : Text;
    text : Text;
  };

  public type ReviewId = Nat;

  public type Review = {
    id : ReviewId;
    dansalId : Nat;
    reviewerPrincipal : Principal;
    reviewerName : Text;
    rating : Nat; // 1–5
    text : Text;
    timestamp : Timestamp;
  };

  public type AddReviewRequest = {
    dansalId : Nat;
    reviewerName : Text;
    rating : Nat;
    text : Text;
  };

  public type LikeResult = {
    likeCount : Nat;
    liked : Bool;
  };

  public type DansalAnalytics = {
    dansalId : Nat;
    name : Text;
    viewCount : Nat;
    likeCount : Nat;
    appreciationCount : Nat;
  };
};
