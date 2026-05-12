// Public API mixin for Dansal domain
import List "mo:core/List";
import DansalLib "../lib/dansal";
import Types "../types/dansal";
import Map "mo:core/Map";

mixin (
  dansals : List.List<Types.Dansal>,
  dansalState : { var nextId : Nat },
  viewCounts : Map.Map<Nat, Nat>,
) {
  public shared ({ caller }) func addDansal(req : Types.AddDansalRequest) : async Types.Dansal {
    DansalLib.addDansal(dansals, dansalState, caller, req);
  };

  public query func getDansals() : async [Types.Dansal] {
    DansalLib.getDansals(dansals);
  };

  public func appreciateDansal(id : Types.DansalId) : async Bool {
    DansalLib.appreciateDansal(dansals, id);
  };

  public query func listDansals() : async [Types.Dansal] {
    DansalLib.getDansals(dansals);
  };

  /// Returns the dansal if approved (or owned by caller). Increments viewCount for non-organizers.
  public shared ({ caller }) func getDansal(id : Types.DansalId) : async ?Types.Dansal {
    switch (dansals.find(func(d : Types.Dansal) : Bool { d.id == id })) {
      case null null;
      case (?d) {
        // Increment view count only for non-organizers
        if (d.organizerPrincipal != caller) {
          let current = switch (viewCounts.get(id)) {
            case (?n) n;
            case null 0;
          };
          viewCounts.add(id, current + 1);
        };
        // Only return approved dansals (or own pending/rejected)
        if (d.status == #approved or d.organizerPrincipal == caller) ?
          d
        else null;
      };
    };
  };

  public shared ({ caller }) func updateDansal(
    id : Types.DansalId,
    req : Types.UpdateDansalRequest,
  ) : async { #ok : Types.Dansal; #err : Text } {
    DansalLib.updateDansal(dansals, caller, id, req);
  };

  public shared ({ caller }) func deleteDansal(
    id : Types.DansalId,
  ) : async { #ok : Bool; #err : Text } {
    DansalLib.deleteDansal(dansals, caller, id);
  };

  public query func filterDansals(
    filter : Types.DansalFilter,
  ) : async [Types.Dansal] {
    DansalLib.filterDansals(dansals, filter);
  };

  public shared query ({ caller }) func getMyDansals() : async [Types.Dansal] {
    DansalLib.getMyDansals(dansals, caller);
  };
};
