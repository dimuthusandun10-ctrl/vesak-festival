// Domain logic for the Vesak Lantern Gallery
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/gallery";
import Int "mo:core/Int";

module {
  public type PhotoId = Types.PhotoId;
  public type GalleryPhoto = Types.GalleryPhoto;
  public type AddPhotoRequest = Types.AddPhotoRequest;

  public func addPhoto(
    photos : List.List<GalleryPhoto>,
    state : { var nextId : Nat },
    req : AddPhotoRequest,
    uploaderPrincipal : Principal,
  ) : GalleryPhoto {
    let photo : GalleryPhoto = {
      id = state.nextId;
      uploaderName = req.uploaderName;
      uploaderPrincipal = uploaderPrincipal;
      image = req.image;
      caption = req.caption;
      appreciationCount = 0;
      uploadedAt = Time.now();
      status = #pending;
      likedBy = [];
    };
    state.nextId += 1;
    photos.add(photo);
    photo;
  };

  public func getPhotos(photos : List.List<GalleryPhoto>) : [GalleryPhoto] {
    // Return only approved photos, newest first
    let arr = photos.toArray();
    arr.filter(func(p : GalleryPhoto) : Bool { p.status == #approved })
       .sort(func(a, b) = Int.compare(b.uploadedAt, a.uploadedAt));
  };

  public func appreciatePhoto(
    photos : List.List<GalleryPhoto>,
    id : PhotoId,
  ) : Bool {
    switch (photos.findIndex(func(p) { p.id == id })) {
      case (?idx) {
        let p = photos.at(idx);
        photos.put(idx, { p with appreciationCount = p.appreciationCount + 1 });
        true;
      };
      case null { false };
    };
  };

  public func seedPhotos(
    _photos : List.List<GalleryPhoto>,
    _state : { var nextId : Nat },
  ) {
    // Gallery starts empty - users upload their own lantern photos
  };
};
