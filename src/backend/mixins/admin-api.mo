// Public API mixin for Admin domain
import List "mo:core/List";
import Map "mo:core/Map";
import AdminLib "../lib/admin";
import AdminTypes "../types/admin";
import DansalTypes "../types/dansal";
import GalleryTypes "../types/gallery";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  profiles : Map.Map<Principal, AdminTypes.UserProfile>,
  reports : List.List<AdminTypes.Report>,
  reportState : { var nextId : Nat },
  notes : List.List<AdminTypes.ReportNote>,
  noteState : { var nextId : Nat },
  pinState : { var pin : Text; var pinUpdatedAt : Int },
  notifications : Map.Map<Principal, List.List<AdminTypes.ApprovalNotification>>,
  dansals : List.List<DansalTypes.Dansal>,
  photos : List.List<GalleryTypes.GalleryPhoto>,
  fallbackSuperAdmin : Principal,
  superAdminState : { var SUPER_ADMIN_PRINCIPAL : Text },
) {
  // ----- User profile -----

  public shared ({ caller }) func registerUser(displayName : Text) : async AdminTypes.UserProfile {
    let isFirstUser = profiles.isEmpty();
    let profile = AdminLib.getOrCreateProfile(profiles, caller, displayName);
    // Grant super admin to the first registered user (once only)
    if (isFirstUser and superAdminState.SUPER_ADMIN_PRINCIPAL == "") {
      superAdminState.SUPER_ADMIN_PRINCIPAL := caller.toText();
      profiles.add(caller, { profile with role = #superAdmin });
      switch (profiles.get(caller)) {
        case (?p) p;
        case null profile;
      };
    } else {
      profile;
    };
  };

  public shared query ({ caller }) func getMyProfile() : async ?AdminTypes.UserProfile {
    AdminLib.getProfile(profiles, caller);
  };

  // ----- Admin: user management -----

  public shared ({ caller }) func listUsers() : async [AdminTypes.UserProfile] {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    let callerIsSuperAdmin = caller.toText() == superAdminState.SUPER_ADMIN_PRINCIPAL
      or caller == fallbackSuperAdmin;
    if (not callerIsSuperAdmin and not AdminLib.isAdmin(callerProfile)) Runtime.trap("Unauthorized");
    AdminLib.listUsers(profiles);
  };

  public shared ({ caller }) func setUserRole(
    target : Principal,
    role : AdminTypes.Role,
  ) : async { #ok; #err : Text } {
    let callerProfile = switch (AdminLib.getProfile(profiles, caller)) {
      case (?p) p;
      case null return #err("Not registered");
    };
    // Super admin check: also accept the stable var principal
    let callerIsSuperAdmin = callerProfile.role == #superAdmin
      or caller.toText() == superAdminState.SUPER_ADMIN_PRINCIPAL
      or caller == fallbackSuperAdmin;
    if (callerIsSuperAdmin) {
      switch (profiles.get(target)) {
        case (?p) {
          profiles.add(target, { p with role });
          #ok;
        };
        case null #err("User not found");
      };
    } else {
      AdminLib.setRole(profiles, callerProfile, target, role);
    };
  };

  public shared ({ caller }) func deleteUser(
    target : Principal,
  ) : async { #ok; #err : Text } {
    let callerProfile = switch (AdminLib.getProfile(profiles, caller)) {
      case (?p) p;
      case null return #err("Not registered");
    };
    AdminLib.deleteUser(profiles, callerProfile, target);
  };

  // ----- Admin: dansal approval -----

  public shared ({ caller }) func getPendingDansals() : async [DansalTypes.Dansal] {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    let callerIsSuperAdmin = caller.toText() == superAdminState.SUPER_ADMIN_PRINCIPAL
      or caller == fallbackSuperAdmin;
    if (not callerIsSuperAdmin and not AdminLib.isAdmin(callerProfile)) Runtime.trap("Unauthorized");
    dansals.toArray().filter(func(d : DansalTypes.Dansal) : Bool {
      switch (d.status) { case (#pending) true; case _ false };
    });
  };

  public shared ({ caller }) func approveDansal(
    id : DansalTypes.DansalId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) return #err("Unauthorized");
    var found = false;
    var organizerPrincipal : ?Principal = null;
    var dansalName : Text = "";
    dansals.mapInPlace(func(d : DansalTypes.Dansal) : DansalTypes.Dansal {
      if (d.id == id) {
        found := true;
        organizerPrincipal := ?d.organizerPrincipal;
        dansalName := d.organizerName;
        { d with status = #approved };
      } else d;
    });
    if (found) {
      switch (organizerPrincipal) {
        case (?op) {
          let notifId = notifications.size();
          AdminLib.addApprovalNotification(
            notifications,
            op,
            {
              id = notifId;
              targetType = #dansal;
              targetId = id;
              targetName = dansalName;
              approvedAt = Time.now();
              seen = false;
            },
          );
        };
        case null ();
      };
      #ok;
    } else #err("Dansal not found");
  };

  public shared ({ caller }) func rejectDansal(
    id : DansalTypes.DansalId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) return #err("Unauthorized");
    var found = false;
    dansals.mapInPlace(func(d : DansalTypes.Dansal) : DansalTypes.Dansal {
      if (d.id == id) { found := true; { d with status = #rejected } } else d;
    });
    if (found) #ok else #err("Dansal not found");
  };

  // ----- Admin: photo approval -----

  public shared ({ caller }) func getPendingPhotos() : async [GalleryTypes.GalleryPhoto] {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    let callerIsSuperAdmin = caller.toText() == superAdminState.SUPER_ADMIN_PRINCIPAL
      or caller == fallbackSuperAdmin;
    if (not callerIsSuperAdmin and not AdminLib.isAdmin(callerProfile)) Runtime.trap("Unauthorized");
    photos.toArray().filter(func(p : GalleryTypes.GalleryPhoto) : Bool {
      switch (p.status) { case (#pending) true; case _ false };
    });
  };

  public shared ({ caller }) func approvePhoto(
    id : GalleryTypes.PhotoId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) return #err("Unauthorized");
    var found = false;
    var uploaderPrincipal : ?Principal = null;
    var photoCaption : Text = "";
    photos.mapInPlace(func(p : GalleryTypes.GalleryPhoto) : GalleryTypes.GalleryPhoto {
      if (p.id == id) {
        found := true;
        uploaderPrincipal := ?p.uploaderPrincipal;
        photoCaption := if (p.caption == "") "Untitled Photo" else p.caption;
        { p with status = #approved };
      } else p;
    });
    if (found) {
      switch (uploaderPrincipal) {
        case (?up) {
          let notifId = notifications.size();
          AdminLib.addApprovalNotification(
            notifications,
            up,
            {
              id = notifId;
              targetType = #photo;
              targetId = id;
              targetName = photoCaption;
              approvedAt = Time.now();
              seen = false;
            },
          );
        };
        case null ();
      };
      #ok;
    } else #err("Photo not found");
  };

  public shared ({ caller }) func rejectPhoto(
    id : GalleryTypes.PhotoId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) return #err("Unauthorized");
    var found = false;
    photos.mapInPlace(func(p : GalleryTypes.GalleryPhoto) : GalleryTypes.GalleryPhoto {
      if (p.id == id) { found := true; { p with status = #rejected } } else p;
    });
    if (found) #ok else #err("Photo not found");
  };

  // ----- Reports -----

  public shared ({ caller }) func submitReport(
    req : AdminTypes.SubmitReportRequest,
  ) : async AdminTypes.Report {
    AdminLib.submitReport(reports, reportState, caller, req);
  };

  public shared ({ caller }) func listReports() : async [AdminTypes.Report] {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    let callerIsSuperAdmin = caller.toText() == superAdminState.SUPER_ADMIN_PRINCIPAL
      or caller == fallbackSuperAdmin;
    if (not callerIsSuperAdmin and not AdminLib.isAdmin(callerProfile)) Runtime.trap("Unauthorized");
    AdminLib.listReports(reports);
  };

  public shared ({ caller }) func dismissReport(
    id : AdminTypes.ReportId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) return #err("Unauthorized");
    AdminLib.dismissReport(reports, id);
  };

  public shared ({ caller }) func actionReport(
    id : AdminTypes.ReportId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) return #err("Unauthorized");
    AdminLib.actionReport(reports, id);
  };

  // ----- Admin PIN -----

  public shared query func verifyAdminPin(pin : Text) : async Bool {
    AdminLib.verifyAdminPin(pinState, pin);
  };

  public shared ({ caller }) func changeAdminPin(
    oldPin : Text,
    newPin : Text,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    AdminLib.changeAdminPin(pinState, callerProfile, oldPin, newPin);
  };

  // ----- Report Notes -----

  public shared ({ caller }) func addReportNote(
    req : AdminTypes.AddReportNoteRequest,
  ) : async { #ok : AdminTypes.NoteId; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    AdminLib.addReportNote(notes, noteState, callerProfile, req);
  };

  public shared query ({ caller }) func getReportNotes(
    reportId : AdminTypes.ReportId,
  ) : async [AdminTypes.ReportNote] {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    if (not AdminLib.isAdmin(callerProfile)) Runtime.trap("Unauthorized");
    AdminLib.getReportNotes(notes, reportId);
  };

  public shared ({ caller }) func deleteReportNote(
    noteId : AdminTypes.NoteId,
  ) : async { #ok; #err : Text } {
    let callerProfile = AdminLib.getProfile(profiles, caller);
    AdminLib.deleteReportNote(notes, callerProfile, noteId);
  };

  // ----- Organizer bio -----

  public shared ({ caller }) func updateOrganizerBio(
    bio : Text,
  ) : async { #ok; #err : Text } {
    AdminLib.updateOrganizerBio(profiles, caller, bio);
  };

  public query func getOrganizerProfile(
    principal : Principal,
  ) : async ?AdminTypes.OrganizerPublicProfile {
    AdminLib.getOrganizerProfile(profiles, principal, dansals.map<DansalTypes.Dansal, { organizer : Principal; status : AdminTypes.ApprovalStatus; viewCount : Nat; likeCount : Nat; id : Nat }>(func(d) { { organizer = d.organizerPrincipal; status = d.status; viewCount = d.viewCount; likeCount = d.appreciationCount; id = d.id } }));
  };

  // ----- Approval Notifications -----

  public shared query ({ caller }) func getApprovalNotifications() : async [AdminTypes.ApprovalNotification] {
    AdminLib.getApprovalNotifications(notifications, caller);
  };

  public shared ({ caller }) func markNotificationSeen(id : Nat) : async () {
    AdminLib.markNotificationSeen(notifications, caller, id);
  };
};
