// Gallery domain types
import Storage "mo:caffeineai-object-storage/Storage";
module {
  public type PhotoId = Nat;

  public type ApprovalStatus = { #pending; #approved; #rejected };

  public type GalleryPhoto = {
    id : PhotoId;
    uploaderName : Text;
    uploaderPrincipal : Principal;
    image : Storage.ExternalBlob;
    caption : Text;
    appreciationCount : Nat;
    uploadedAt : Int;
    status : ApprovalStatus;
    likedBy : [Principal];
  };

  public type AddPhotoRequest = {
    uploaderName : Text;
    image : Storage.ExternalBlob;
    caption : Text;
  };
};
