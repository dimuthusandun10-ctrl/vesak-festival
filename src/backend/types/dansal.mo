// Dansal domain types
module {
  public type DansalId = Nat;

  public type ApprovalStatus = { #pending; #approved; #rejected };

  public type Dansal = {
    id : DansalId;
    organizerName : Text;
    organizerPrincipal : Principal;
    foodTypes : [Text];
    date : Text;
    time : Text;
    locationLink : Text;
    contactPhone : Text;
    contactName : Text;
    appreciationCount : Nat;
    createdAt : Int;
    latitude : Float;
    longitude : Float;
    province : Text;
    district : Text;
    category : Text;
    status : ApprovalStatus;
    likedBy : [Principal];
    viewCount : Nat;
  };

  public type AddDansalRequest = {
    organizerName : Text;
    foodTypes : [Text];
    date : Text;
    time : Text;
    locationLink : Text;
    contactPhone : Text;
    contactName : Text;
    latitude : Float;
    longitude : Float;
    province : Text;
    district : Text;
    category : Text;
  };

  public type UpdateDansalRequest = {
    organizerName : ?Text;
    foodTypes : ?[Text];
    date : ?Text;
    time : ?Text;
    locationLink : ?Text;
    contactPhone : ?Text;
    contactName : ?Text;
    latitude : ?Float;
    longitude : ?Float;
    province : ?Text;
    district : ?Text;
    category : ?Text;
  };

  public type DansalFilter = {
    province : ?Text;
    district : ?Text;
    category : ?Text;
    foodType : ?Text;
    timeStart : ?Text;
    timeEnd : ?Text;
  };
};
