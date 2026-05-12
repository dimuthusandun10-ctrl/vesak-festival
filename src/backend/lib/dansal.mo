// Domain logic for Dansals
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/dansal";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  public type DansalId = Types.DansalId;
  public type Dansal = Types.Dansal;
  public type AddDansalRequest = Types.AddDansalRequest;
  public type UpdateDansalRequest = Types.UpdateDansalRequest;
  public type DansalFilter = Types.DansalFilter;

  public func addDansal(
    dansals : List.List<Dansal>,
    state : { var nextId : Nat },
    caller : Principal,
    req : AddDansalRequest,
  ) : Dansal {
    let dansal : Dansal = {
      id = state.nextId;
      organizerName = req.organizerName;
      organizerPrincipal = caller;
      foodTypes = req.foodTypes;
      date = req.date;
      time = req.time;
      locationLink = req.locationLink;
      contactPhone = req.contactPhone;
      contactName = req.contactName;
      appreciationCount = 0;
      createdAt = Time.now();
      latitude = req.latitude;
      longitude = req.longitude;
      province = req.province;
      district = req.district;
      category = req.category;
      status = #pending;
      likedBy = [];
      viewCount = 0;
    };
    state.nextId += 1;
    dansals.add(dansal);
    dansal;
  };

  public func getDansals(dansals : List.List<Dansal>) : [Dansal] {
    // Return only approved dansals, newest first
    let arr = dansals.toArray();
    arr.filter(func(d : Dansal) : Bool { d.status == #approved })
       .sort(func(a, b) = Int.compare(b.createdAt, a.createdAt));
  };

  public func appreciateDansal(
    dansals : List.List<Dansal>,
    id : DansalId,
  ) : Bool {
    switch (dansals.findIndex(func(d) { d.id == id })) {
      case (?idx) {
        let d = dansals.at(idx);
        dansals.put(idx, { d with appreciationCount = d.appreciationCount + 1 });
        true;
      };
      case null { false };
    };
  };

  public func updateDansal(
    dansals : List.List<Dansal>,
    caller : Principal,
    id : DansalId,
    req : UpdateDansalRequest,
  ) : { #ok : Dansal; #err : Text } {
    switch (dansals.findIndex(func(d) { d.id == id })) {
      case null { #err("Not found") };
      case (?idx) {
        let d = dansals.at(idx);
        if (not Principal.equal(caller, d.organizerPrincipal)) {
          return #err("Not authorized");
        };
        let updated : Dansal = {
          d with
          organizerName = switch (req.organizerName) { case (?v) v; case null d.organizerName };
          foodTypes = switch (req.foodTypes) { case (?v) v; case null d.foodTypes };
          date = switch (req.date) { case (?v) v; case null d.date };
          time = switch (req.time) { case (?v) v; case null d.time };
          locationLink = switch (req.locationLink) { case (?v) v; case null d.locationLink };
          contactPhone = switch (req.contactPhone) { case (?v) v; case null d.contactPhone };
          contactName = switch (req.contactName) { case (?v) v; case null d.contactName };
          latitude = switch (req.latitude) { case (?v) v; case null d.latitude };
          longitude = switch (req.longitude) { case (?v) v; case null d.longitude };
          province = switch (req.province) { case (?v) v; case null d.province };
          district = switch (req.district) { case (?v) v; case null d.district };
          category = switch (req.category) { case (?v) v; case null d.category };
        };
        dansals.put(idx, updated);
        #ok(updated);
      };
    };
  };

  public func deleteDansal(
    dansals : List.List<Dansal>,
    caller : Principal,
    id : DansalId,
  ) : { #ok : Bool; #err : Text } {
    switch (dansals.findIndex(func(d) { d.id == id })) {
      case null { #err("Not found") };
      case (?idx) {
        let d = dansals.at(idx);
        if (not Principal.equal(caller, d.organizerPrincipal)) {
          return #err("Not authorized");
        };
        // Rebuild the list without the deleted item
        let filtered = dansals.filter(func(x) { x.id != id });
        dansals.clear();
        dansals.append(filtered);
        #ok(true);
      };
    };
  };

  public func filterDansals(
    dansals : List.List<Dansal>,
    filter : DansalFilter,
  ) : [Dansal] {
    let arr = dansals.toArray();
    arr.filter(func(d : Dansal) : Bool {
      if (d.status != #approved) return false;
      let matchProvince = switch (filter.province) {
        case null true;
        case (?p) d.province == p;
      };
      let matchDistrict = switch (filter.district) {
        case null true;
        case (?dist) d.district == dist;
      };
      let matchCategory = switch (filter.category) {
        case null true;
        case (?cat) d.category == cat;
      };
      let matchFoodType = switch (filter.foodType) {
        case null true;
        case (?ft) {
          let foods : [Text] = d.foodTypes;
          foods.find(func(f) { f == ft }) != null;
        };
      };
      let matchTimeStart = switch (filter.timeStart) {
        case null true;
        case (?ts) d.time >= ts;
      };
      let matchTimeEnd = switch (filter.timeEnd) {
        case null true;
        case (?te) d.time <= te;
      };
      matchProvince and matchDistrict and matchCategory and matchFoodType and matchTimeStart and matchTimeEnd;
    });
  };

  public func getMyDansals(
    dansals : List.List<Dansal>,
    caller : Principal,
  ) : [Dansal] {
    let arr = dansals.toArray();
    arr.filter(func(d) { Principal.equal(d.organizerPrincipal, caller) });
  };

  public func seedDansals(
    dansals : List.List<Dansal>,
    state : { var nextId : Nat },
  ) {
    if (dansals.size() > 0) { return };
    let anonymousPrincipal = Principal.fromText("2vxsx-fae");
    let now = Time.now();
    let seeds : [Dansal] = [
      {
        id = state.nextId;
        organizerName = "Colombo Buddhist Brotherhood";
        organizerPrincipal = anonymousPrincipal;
        foodTypes = ["Kiribath", "Milk Rice", "Wattalappam", "Kiri Toffee"];
        date = "2026-05-12";
        time = "06:00 AM - 06:00 PM";
        locationLink = "https://maps.google.com/?q=Colombo+7+Sri+Lanka";
        contactPhone = "+94 77 123 4567";
        contactName = "Ananda Perera";
        appreciationCount = 42;
        createdAt = now;
        latitude = 6.9271;
        longitude = 79.8612;
        province = "Western";
        district = "Colombo";
        category = "Rice & Curry";
        status = #approved;
        likedBy = [];
        viewCount = 0;
      },
      {
        id = state.nextId + 1;
        organizerName = "Kandy Sangha Foundation";
        organizerPrincipal = anonymousPrincipal;
        foodTypes = ["Rice and Curry", "Dhal Curry", "Papadums", "Coconut Sambol"];
        date = "2026-05-12";
        time = "07:00 AM - 08:00 PM";
        locationLink = "https://maps.google.com/?q=Kandy+Lake+Sri+Lanka";
        contactPhone = "+94 81 234 5678";
        contactName = "Nimali Jayawardena";
        appreciationCount = 31;
        createdAt = now - 100_000_000;
        latitude = 7.2906;
        longitude = 80.6337;
        province = "Central";
        district = "Kandy";
        category = "Rice & Curry";
        status = #approved;
        likedBy = [];
        viewCount = 0;
      },
      {
        id = state.nextId + 2;
        organizerName = "Galle District Welfare Society";
        organizerPrincipal = anonymousPrincipal;
        foodTypes = ["Pittu", "Coconut Milk", "String Hoppers", "Fish Curry"];
        date = "2026-05-12";
        time = "05:30 AM - 07:00 PM";
        locationLink = "https://maps.google.com/?q=Galle+Fort+Sri+Lanka";
        contactPhone = "+94 91 345 6789";
        contactName = "Sunil Bandara";
        appreciationCount = 27;
        createdAt = now - 200_000_000;
        latitude = 6.0535;
        longitude = 80.2210;
        province = "Southern";
        district = "Galle";
        category = "String Hoppers";
        status = #approved;
        likedBy = [];
        viewCount = 0;
      },
      {
        id = state.nextId + 3;
        organizerName = "Matara Dhamma Circle";
        organizerPrincipal = anonymousPrincipal;
        foodTypes = ["Hoppers", "Egg Hoppers", "Coconut Roti", "Lunu Miris"];
        date = "2026-05-12";
        time = "08:00 AM - 05:00 PM";
        locationLink = "https://maps.google.com/?q=Matara+Sri+Lanka";
        contactPhone = "+94 41 456 7890";
        contactName = "Kamal Dissanayake";
        appreciationCount = 19;
        createdAt = now - 300_000_000;
        latitude = 5.9549;
        longitude = 80.5550;
        province = "Southern";
        district = "Matara";
        category = "Hoppers";
        status = #approved;
        likedBy = [];
        viewCount = 0;
      },
      {
        id = state.nextId + 4;
        organizerName = "Negombo Sangamitta Group";
        organizerPrincipal = anonymousPrincipal;
        foodTypes = ["Pol Roti", "Seeni Sambol", "Sweet Meats", "Kavum", "Kokis"];
        date = "2026-05-12";
        time = "06:00 AM - 06:00 PM";
        locationLink = "https://maps.google.com/?q=Negombo+Sri+Lanka";
        contactPhone = "+94 31 567 8901";
        contactName = "Chamara Rathnayake";
        appreciationCount = 15;
        createdAt = now - 400_000_000;
        latitude = 7.2095;
        longitude = 79.8386;
        province = "Western";
        district = "Gampaha";
        category = "Sweets";
        status = #approved;
        likedBy = [];
        viewCount = 0;
      },
    ];
    for (seed in seeds.values()) {
      dansals.add(seed);
    };
    state.nextId += seeds.size();
  };
};
