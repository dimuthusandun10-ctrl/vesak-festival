// Domain logic for admin: user profiles, roles, approval, reports, notes, PIN, notifications
import List "mo:core/List";
import Map "mo:core/Map";
import AdminTypes "../types/admin";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

module {
  public type UserProfile = AdminTypes.UserProfile;
  public type Role = AdminTypes.Role;
  public type Report = AdminTypes.Report;
  public type ReportId = AdminTypes.ReportId;
  public type SubmitReportRequest = AdminTypes.SubmitReportRequest;
  public type ApprovalStatus = AdminTypes.ApprovalStatus;
  public type NoteId = AdminTypes.NoteId;
  public type ReportNote = AdminTypes.ReportNote;
  public type AddReportNoteRequest = AdminTypes.AddReportNoteRequest;
  public type AdminPinRecord = AdminTypes.AdminPinRecord;
  public type OrganizerPublicProfile = AdminTypes.OrganizerPublicProfile;
  public type ApprovalNotification = AdminTypes.ApprovalNotification;

  public func getOrCreateProfile(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
    displayName : Text,
  ) : UserProfile {
    switch (profiles.get(caller)) {
      case (?p) p;
      case null {
        let profile : UserProfile = {
          principal = caller;
          role = #user;
          displayName;
          registeredAt = Time.now();
          bio = "";
          bioUpdatedAt = null;
        };
        profiles.add(caller, profile);
        profile;
      };
    };
  };

  public func getProfile(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
  ) : ?UserProfile {
    profiles.get(caller);
  };

  public func listUsers(
    profiles : Map.Map<Principal, UserProfile>,
  ) : [UserProfile] {
    profiles.values().toArray();
  };

  public func setRole(
    profiles : Map.Map<Principal, UserProfile>,
    callerProfile : UserProfile,
    target : Principal,
    role : Role,
  ) : { #ok; #err : Text } {
    switch (callerProfile.role) {
      case (#admin or #superAdmin) {
        switch (profiles.get(target)) {
          case (?p) {
            profiles.add(target, { p with role });
            #ok;
          };
          case null #err("User not found");
        };
      };
      case _ #err("Unauthorized");
    };
  };

  public func deleteUser(
    profiles : Map.Map<Principal, UserProfile>,
    callerProfile : UserProfile,
    target : Principal,
  ) : { #ok; #err : Text } {
    switch (callerProfile.role) {
      case (#admin or #superAdmin) {
        profiles.remove(target);
        #ok;
      };
      case _ #err("Unauthorized");
    };
  };

  public func isAdmin(profile : ?UserProfile) : Bool {
    switch (profile) {
      case (?(p)) p.role == #admin or p.role == #superAdmin;
      case null false;
    };
  };

  public func isSuperAdmin(profile : ?UserProfile, superAdminPrincipal : Principal) : Bool {
    ignore superAdminPrincipal;
    switch (profile) {
      case (?(p)) p.role == #superAdmin;
      case null false;
    };
  };

  public func submitReport(
    reports : List.List<Report>,
    reportState : { var nextId : Nat },
    caller : Principal,
    req : SubmitReportRequest,
  ) : Report {
    let report : Report = {
      id = reportState.nextId;
      targetId = req.targetId;
      targetType = req.targetType;
      reporterPrincipal = caller;
      reason = req.reason;
      description = req.description;
      timestamp = Time.now();
      status = #pending;
    };
    reportState.nextId += 1;
    reports.add(report);
    report;
  };

  public func listReports(
    reports : List.List<Report>,
  ) : [Report] {
    reports.toArray();
  };

  public func dismissReport(
    reports : List.List<Report>,
    id : ReportId,
  ) : { #ok; #err : Text } {
    var found = false;
    reports.mapInPlace(func(r : Report) : Report {
      if (r.id == id) { found := true; { r with status = #dismissed } } else r;
    });
    if (found) #ok else #err("Report not found");
  };

  public func actionReport(
    reports : List.List<Report>,
    id : ReportId,
  ) : { #ok; #err : Text } {
    var found = false;
    reports.mapInPlace(func(r : Report) : Report {
      if (r.id == id) { found := true; { r with status = #actioned } } else r;
    });
    if (found) #ok else #err("Report not found");
  };

  // ----- Report Notes -----

  public func addReportNote(
    notes : List.List<ReportNote>,
    noteState : { var nextId : Nat },
    callerProfile : ?UserProfile,
    req : AddReportNoteRequest,
  ) : { #ok : NoteId; #err : Text } {
    switch (callerProfile) {
      case null #err("Unauthorized");
      case (?p) {
        switch (p.role) {
          case (#admin or #superAdmin) {
            let note : ReportNote = {
              id = noteState.nextId;
              reportId = req.reportId;
              authorId = p.principal;
              authorName = p.displayName;
              text = req.text;
              createdAt = Time.now();
            };
            noteState.nextId += 1;
            notes.add(note);
            #ok(note.id);
          };
          case _ #err("Unauthorized");
        };
      };
    };
  };

  public func getReportNotes(
    notes : List.List<ReportNote>,
    reportId : ReportId,
  ) : [ReportNote] {
    notes.filter(func(n : ReportNote) : Bool { n.reportId == reportId }).toArray();
  };

  public func deleteReportNote(
    notes : List.List<ReportNote>,
    callerProfile : ?UserProfile,
    noteId : NoteId,
  ) : { #ok; #err : Text } {
    switch (callerProfile) {
      case null #err("Unauthorized");
      case (?p) {
        switch (p.role) {
          case (#admin or #superAdmin) {
            let before = notes.size();
            notes.retain(func(n : ReportNote) : Bool { n.id != noteId });
            if (notes.size() < before) #ok else #err("Note not found");
          };
          case _ #err("Unauthorized");
        };
      };
    };
  };

  // ----- Admin PIN -----

  public func verifyAdminPin(
    pinRecord : { var pin : Text },
    inputPin : Text,
  ) : Bool {
    pinRecord.pin == inputPin;
  };

  public func changeAdminPin(
    pinRecord : { var pin : Text; var pinUpdatedAt : Int },
    callerProfile : ?UserProfile,
    oldPin : Text,
    newPin : Text,
  ) : { #ok; #err : Text } {
    if (pinRecord.pin != oldPin) return #err("Incorrect current PIN");
    switch (callerProfile) {
      case null #err("Unauthorized");
      case (?p) {
        switch (p.role) {
          case (#admin or #superAdmin) {
            pinRecord.pin := newPin;
            pinRecord.pinUpdatedAt := Time.now();
            #ok;
          };
          case _ #err("Unauthorized");
        };
      };
    };
  };

  // ----- Organizer bio -----

  public func updateOrganizerBio(
    profiles : Map.Map<Principal, UserProfile>,
    caller : Principal,
    bio : Text,
  ) : { #ok; #err : Text } {
    switch (profiles.get(caller)) {
      case null #err("Profile not found");
      case (?p) {
        profiles.add(caller, { p with bio; bioUpdatedAt = ?Time.now() });
        #ok;
      };
    };
  };

  public func getOrganizerProfile(
    profiles : Map.Map<Principal, UserProfile>,
    principal : Principal,
    dansals : List.List<{ organizer : Principal; status : ApprovalStatus; viewCount : Nat; likeCount : Nat; id : Nat }>,
  ) : ?OrganizerPublicProfile {
    switch (profiles.get(principal)) {
      case null null;
      case (?p) {
        var totalViews : Nat = 0;
        var totalLikes : Nat = 0;
        var count : Nat = 0;
        for (d in dansals.values()) {
          if (d.organizer == principal and d.status == #approved) {
            totalViews += d.viewCount;
            totalLikes += d.likeCount;
            count += 1;
          };
        };
        ?{
          principal;
          name = p.displayName;
          bio = p.bio;
          avgRating = 0.0;
          totalDansals = count;
          totalViews;
          totalLikes;
        };
      };
    };
  };

  // ----- Approval Notifications -----

  public func getApprovalNotifications(
    notifications : Map.Map<Principal, List.List<ApprovalNotification>>,
    caller : Principal,
  ) : [ApprovalNotification] {
    switch (notifications.get(caller)) {
      case null [];
      case (?lst) lst.toArray();
    };
  };

  public func markNotificationSeen(
    notifications : Map.Map<Principal, List.List<ApprovalNotification>>,
    caller : Principal,
    id : Nat,
  ) : () {
    switch (notifications.get(caller)) {
      case null ();
      case (?lst) {
        lst.mapInPlace(func(n : ApprovalNotification) : ApprovalNotification {
          if (n.id == id) { { n with seen = true } } else n;
        });
      };
    };
  };

  public func addApprovalNotification(
    notifications : Map.Map<Principal, List.List<ApprovalNotification>>,
    target : Principal,
    notification : ApprovalNotification,
  ) : () {
    switch (notifications.get(target)) {
      case null {
        let lst = List.empty<ApprovalNotification>();
        lst.add(notification);
        notifications.add(target, lst);
      };
      case (?lst) lst.add(notification);
    };
  };
};
