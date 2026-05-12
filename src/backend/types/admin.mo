// Admin domain types: user profiles, roles, reports, notes, PIN, notifications
module {
  public type Role = { #user; #organizer; #admin; #superAdmin };

  public type UserProfile = {
    principal : Principal;
    role : Role;
    displayName : Text;
    registeredAt : Int;
    bio : Text;
    bioUpdatedAt : ?Int;
  };

  public type ReportTargetType = { #dansal; #photo };

  public type ReportStatus = { #pending; #dismissed; #actioned };

  public type ReportId = Nat;

  public type Report = {
    id : ReportId;
    targetId : Nat;
    targetType : ReportTargetType;
    reporterPrincipal : Principal;
    reason : { #fake; #spam; #inappropriate; #other };
    description : ?Text;
    timestamp : Int;
    status : ReportStatus;
  };

  public type SubmitReportRequest = {
    targetId : Nat;
    targetType : ReportTargetType;
    reason : { #fake; #spam; #inappropriate; #other };
    description : ?Text;
  };

  public type ApprovalStatus = { #pending; #approved; #rejected };

  // Report notes (timeline, admin-only)
  public type NoteId = Nat;

  public type ReportNote = {
    id : NoteId;
    reportId : ReportId;
    authorId : Principal;
    authorName : Text;
    text : Text;
    createdAt : Int;
  };

  public type AddReportNoteRequest = {
    reportId : ReportId;
    text : Text;
  };

  // Admin PIN stored in stable state
  public type AdminPinRecord = {
    pin : Text;
    updatedAt : Int;
  };

  // Organizer public profile
  public type OrganizerPublicProfile = {
    principal : Principal;
    name : Text;
    bio : Text;
    avgRating : Float;
    totalDansals : Nat;
    totalViews : Nat;
    totalLikes : Nat;
  };

  // Approval notifications for organisers
  public type ApprovalNotification = {
    id : Nat;
    targetType : ReportTargetType;
    targetId : Nat;
    targetName : Text;
    approvedAt : Int;
    seen : Bool;
  };
};
