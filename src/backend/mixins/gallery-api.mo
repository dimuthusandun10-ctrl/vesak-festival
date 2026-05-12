// Public API mixin for Gallery domain
import List "mo:core/List";
import GalleryLib "../lib/gallery";
import Types "../types/gallery";

mixin (
  photos : List.List<Types.GalleryPhoto>,
  galleryState : { var nextId : Nat },
) {
  public shared ({ caller }) func addGalleryPhoto(req : Types.AddPhotoRequest) : async Types.GalleryPhoto {
    GalleryLib.addPhoto(photos, galleryState, req, caller);
  };

  public query func getGalleryPhotos() : async [Types.GalleryPhoto] {
    GalleryLib.getPhotos(photos);
  };

  public func appreciatePhoto(id : Types.PhotoId) : async Bool {
    GalleryLib.appreciatePhoto(photos, id);
  };

  public shared ({ caller }) func uploadPhoto(req : Types.AddPhotoRequest) : async Types.GalleryPhoto {
    GalleryLib.addPhoto(photos, galleryState, req, caller);
  };

  public query func listPhotos() : async [Types.GalleryPhoto] {
    GalleryLib.getPhotos(photos);
  };

  public func likePhoto(id : Types.PhotoId) : async Bool {
    GalleryLib.appreciatePhoto(photos, id);
  };
};
