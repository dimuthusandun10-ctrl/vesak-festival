// Domain logic for social features: likes, comments, reviews, favorites, analytics
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import SocialTypes "../types/social";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Float "mo:core/Float";
import DansalTypes "../types/dansal";

module {
  public type Comment = SocialTypes.Comment;
  public type CommentId = SocialTypes.CommentId;
  public type AddCommentRequest = SocialTypes.AddCommentRequest;
  public type Review = SocialTypes.Review;
  public type ReviewId = SocialTypes.ReviewId;
  public type AddReviewRequest = SocialTypes.AddReviewRequest;
  public type LikeResult = SocialTypes.LikeResult;
  public type DansalAnalytics = SocialTypes.DansalAnalytics;
  public type PhotoComment = SocialTypes.PhotoComment;
  public type PhotoCommentId = SocialTypes.PhotoCommentId;
  public type AddPhotoCommentRequest = SocialTypes.AddPhotoCommentRequest;

  // ----- Likes -----

  /// Toggle like on a Dansal; returns updated like count and whether caller now likes it.
  public func toggleDansalLike(
    dansalLikes : Map.Map<Nat, Set.Set<Principal>>,
    dansalId : Nat,
    caller : Principal,
  ) : LikeResult {
    let likers = switch (dansalLikes.get(dansalId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        dansalLikes.add(dansalId, s);
        s;
      };
    };
    let liked = likers.contains(caller);
    if (liked) { likers.remove(caller) } else { likers.add(caller) };
    { likeCount = likers.size(); liked = not liked };
  };

  /// Toggle like on a GalleryPhoto.
  public func togglePhotoLike(
    photoLikes : Map.Map<Nat, Set.Set<Principal>>,
    photoId : Nat,
    caller : Principal,
  ) : LikeResult {
    let likers = switch (photoLikes.get(photoId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Principal>();
        photoLikes.add(photoId, s);
        s;
      };
    };
    let liked = likers.contains(caller);
    if (liked) { likers.remove(caller) } else { likers.add(caller) };
    { likeCount = likers.size(); liked = not liked };
  };

  /// Return whether caller has liked the given Dansal.
  public func isDansalLikedByUser(
    dansalLikes : Map.Map<Nat, Set.Set<Principal>>,
    dansalId : Nat,
    caller : Principal,
  ) : Bool {
    switch (dansalLikes.get(dansalId)) {
      case (?s) s.contains(caller);
      case null false;
    };
  };

  // ----- Comments -----

  public func addComment(
    comments : List.List<Comment>,
    commentState : { var nextId : Nat },
    caller : Principal,
    req : AddCommentRequest,
  ) : Comment {
    let comment : Comment = {
      id = commentState.nextId;
      dansalId = req.dansalId;
      authorPrincipal = caller;
      authorName = req.authorName;
      text = req.text;
      timestamp = Time.now();
    };
    commentState.nextId += 1;
    comments.add(comment);
    comment;
  };

  public func getComments(
    comments : List.List<Comment>,
    dansalId : Nat,
  ) : [Comment] {
    comments.toArray().filter(func(c) { c.dansalId == dansalId });
  };

  public func deleteComment(
    comments : List.List<Comment>,
    caller : Principal,
    id : CommentId,
  ) : { #ok; #err : Text } {
    var found = false;
    var authorized = false;
    for (c in comments.values()) {
      if (c.id == id) {
        found := true;
        if (c.authorPrincipal == caller) authorized := true;
      };
    };
    if (not found) return #err("Comment not found");
    if (not authorized) return #err("Unauthorized");
    let filtered = comments.filter(func(c : Comment) : Bool { c.id != id });
    comments.clear();
    comments.append(filtered);
    #ok;
  };

  // ----- Photo Comments -----

  public func addPhotoComment(
    photoComments : List.List<PhotoComment>,
    photoCommentState : { var nextId : Nat },
    caller : Principal,
    req : AddPhotoCommentRequest,
  ) : { #ok : PhotoComment; #err : Text } {
    if (req.text.size() == 0) return #err("Comment cannot be empty");
    if (req.text.size() > 500) return #err("Comment exceeds 500 characters");
    let comment : PhotoComment = {
      id = photoCommentState.nextId;
      photoId = req.photoId;
      authorPrincipal = caller;
      authorName = req.authorName;
      text = req.text;
      timestamp = Time.now();
    };
    photoCommentState.nextId += 1;
    photoComments.add(comment);
    #ok(comment);
  };

  public func getPhotoComments(
    photoComments : List.List<PhotoComment>,
    photoId : Nat,
  ) : [PhotoComment] {
    let filtered = photoComments.toArray().filter(func(c : PhotoComment) : Bool { c.photoId == photoId });
    // Return newest first
    filtered.reverse();
  };

  public func deletePhotoComment(
    photoComments : List.List<PhotoComment>,
    caller : Principal,
    id : PhotoCommentId,
  ) : { #ok; #err : Text } {
    var found = false;
    var authorized = false;
    for (c in photoComments.values()) {
      if (c.id == id) {
        found := true;
        if (c.authorPrincipal == caller) authorized := true;
      };
    };
    if (not found) return #err("Photo comment not found");
    if (not authorized) return #err("Unauthorized");
    let filtered = photoComments.filter(func(c : PhotoComment) : Bool { c.id != id });
    photoComments.clear();
    photoComments.append(filtered);
    #ok;
  };

  // ----- Reviews -----

  public func addReview(
    reviews : List.List<Review>,
    reviewState : { var nextId : Nat },
    caller : Principal,
    req : AddReviewRequest,
  ) : { #ok : Review; #err : Text } {
    if (req.rating < 1 or req.rating > 5) return #err("Rating must be 1\u{2013}5");
    let alreadyReviewed = reviews.toArray().find(func(r : Review) : Bool {
      r.dansalId == req.dansalId and r.reviewerPrincipal == caller
    }) != null;
    if (alreadyReviewed) return #err("Already reviewed");
    let review : Review = {
      id = reviewState.nextId;
      dansalId = req.dansalId;
      reviewerPrincipal = caller;
      reviewerName = req.reviewerName;
      rating = req.rating;
      text = req.text;
      timestamp = Time.now();
    };
    reviewState.nextId += 1;
    reviews.add(review);
    #ok(review);
  };

  public func getReviews(
    reviews : List.List<Review>,
    dansalId : Nat,
  ) : [Review] {
    reviews.toArray().filter(func(r) { r.dansalId == dansalId });
  };

  public func deleteReview(
    reviews : List.List<Review>,
    caller : Principal,
    id : ReviewId,
  ) : { #ok; #err : Text } {
    var found = false;
    var authorized = false;
    for (r in reviews.values()) {
      if (r.id == id) {
        found := true;
        if (r.reviewerPrincipal == caller) authorized := true;
      };
    };
    if (not found) return #err("Review not found");
    if (not authorized) return #err("Unauthorized");
    let filtered = reviews.filter(func(r : Review) : Bool { r.id != id });
    reviews.clear();
    reviews.append(filtered);
    #ok;
  };

  public func getAverageRating(
    reviews : List.List<Review>,
    dansalId : Nat,
  ) : Float {
    let relevant = reviews.toArray().filter(func(r) { r.dansalId == dansalId });
    let count = relevant.size();
    if (count == 0) return 0.0;
    var sum = 0;
    for (r in relevant.values()) { sum += r.rating };
    sum.toFloat() / count.toFloat();
  };

  // ----- Favorites -----

  public func toggleFavorite(
    favorites : Map.Map<Principal, List.List<Nat>>,
    caller : Principal,
    dansalId : Nat,
  ) : Bool {
    let favList = switch (favorites.get(caller)) {
      case (?l) l;
      case null {
        let l = List.empty<Nat>();
        favorites.add(caller, l);
        l;
      };
    };
    let alreadyFaved = favList.toArray().find(func(id) { id == dansalId }) != null;
    if (alreadyFaved) {
      let filtered = favList.filter(func(id : Nat) : Bool { id != dansalId });
      favList.clear();
      favList.append(filtered);
      false;
    } else {
      favList.add(dansalId);
      true;
    };
  };

  public func getFavorites(
    favorites : Map.Map<Principal, List.List<Nat>>,
    caller : Principal,
  ) : [Nat] {
    switch (favorites.get(caller)) {
      case (?l) l.toArray();
      case null [];
    };
  };

  public func isFavorited(
    favorites : Map.Map<Principal, List.List<Nat>>,
    caller : Principal,
    dansalId : Nat,
  ) : Bool {
    switch (favorites.get(caller)) {
      case (?l) l.toArray().find(func(id) { id == dansalId }) != null;
      case null false;
    };
  };

  // ----- Analytics -----

  public func incrementViewCount(
    viewCounts : Map.Map<Nat, Nat>,
    dansalId : Nat,
    caller : Principal,
    organizerPrincipal : Principal,
  ) {
    if (caller == organizerPrincipal) return;
    let current = switch (viewCounts.get(dansalId)) {
      case (?n) n;
      case null 0;
    };
    viewCounts.add(dansalId, current + 1);
  };

  public func getAnalytics(
    viewCounts : Map.Map<Nat, Nat>,
    dansalLikes : Map.Map<Nat, Set.Set<Principal>>,
    dansalId : Nat,
    dansalName : Text,
    appreciationCount : Nat,
  ) : DansalAnalytics {
    let viewCount = switch (viewCounts.get(dansalId)) {
      case (?n) n;
      case null 0;
    };
    let likeCount = switch (dansalLikes.get(dansalId)) {
      case (?s) s.size();
      case null 0;
    };
    { dansalId; name = dansalName; viewCount; likeCount; appreciationCount };
  };

  /// Return analytics for all dansals owned by the caller.
  public func getMyAnalytics(
    dansals : List.List<DansalTypes.Dansal>,
    caller : Principal,
    viewCounts : Map.Map<Nat, Nat>,
    dansalLikes : Map.Map<Nat, Set.Set<Principal>>,
  ) : [DansalAnalytics] {
    dansals.toArray()
      .filter(func(d : DansalTypes.Dansal) : Bool { d.organizerPrincipal == caller })
      .map<DansalTypes.Dansal, DansalAnalytics>(func(d) {
        let viewCount = switch (viewCounts.get(d.id)) {
          case (?n) n;
          case null 0;
        };
        let likeCount = switch (dansalLikes.get(d.id)) {
          case (?s) s.size();
          case null 0;
        };
        { dansalId = d.id; name = d.organizerName; viewCount; likeCount; appreciationCount = d.appreciationCount };
      });
  };
};
