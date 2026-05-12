/** All 9 provinces of Sri Lanka. */
export const PROVINCES: string[] = [
  "බස්නාහිර / Western",
  "මධ්‍යම / Central",
  "දකුණ / Southern",
  "උතුර / Northern",
  "නැගෙනහිර / Eastern",
  "වයඹ / North Western",
  "උතුරු මැද / North Central",
  "ඌව / Uva",
  "සබරගමුව / Sabaragamuwa",
];

/** Districts grouped by province. */
export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  "බස්නාහිර / Western": ["කොළඹ / Colombo", "ගම්පහ / Gampaha", "කළුතර / Kalutara"],
  "මධ්‍යම / Central": ["මහනුවර / Kandy", "මාතලේ / Matale", "නුවරඑළිය / Nuwara Eliya"],
  "දකුණ / Southern": ["ගාල්ල / Galle", "මාතර / Matara", "හම්බන්තොට / Hambantota"],
  "උතුර / Northern": [
    "යාපනය / Jaffna",
    "කිළිනොච්චිය / Kilinochchi",
    "මන්නාරම / Mannar",
    "මුලතිව් / Mullaitivu",
    "වවුනියාව / Vavuniya",
  ],
  "නැගෙනහිර / Eastern": [
    "ත්‍රිකුණාමළය / Trincomalee",
    "මඩකලපුව / Batticaloa",
    "අම්පාර / Ampara",
  ],
  "වයඹ / North Western": ["කුරුණෑගල / Kurunegala", "පුත්තලම / Puttalam"],
  "උතුරු මැද / North Central": [
    "අනුරාධාපුර / Anuradhapura",
    "පොළොන්නරුව / Polonnaruwa",
  ],
  "ඌව / Uva": ["බදුල්ල / Badulla", "මොණරාගල / Monaragala"],
  "සබරගමුව / Sabaragamuwa": ["රත්නපුර / Ratnapura", "කෑගල්ල / Kegalle"],
};

/** Flat list of all districts across Sri Lanka. */
export const ALL_DISTRICTS: string[] = Object.values(
  DISTRICTS_BY_PROVINCE,
).flat();

/** Food / service categories available at a Dansal. */
export const FOOD_CATEGORIES: string[] = [
  "කිරිබත් / Kiribath",
  "බත් / Rice Meals",
  "කෑමවර්ග / Full Meals",
  "බීම / Beverages",
  "පාන් / Bread & Bakery",
  "අතිකෑම / Snacks",
  "මිදුල් / Sweets",
  "ෆ්‍රූට් / Fruits",
  "ජල / Water",
  "ඖෂධ / Herbal Drinks",
  "වෙනත් / Other",
];
