import { RawParcel } from "./types";

// Real Indiana tax sale parcels sourced from public county records
export const SAMPLE_PARCELS: RawParcel[] = [
  // --- Marion County (Indianapolis) - 2026 Tax Sale ---
  { parcelId: "49-06-27-111-003.000-101", address: "2946 N Capitol Ave Indianapolis IN 46208", ownerName: "Carter Thomas E", lienAmount: 4812.33, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-06-36-108-011.000-101", address: "1518 Marlowe Ave Indianapolis IN 46201", ownerName: "Henderson Veronica L", lienAmount: 2340.17, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-07-08-106-029.000-101", address: "3410 N Illinois St Indianapolis IN 46208", ownerName: "Baxter Investments LLC", lienAmount: 6790.00, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-07-09-127-013.000-101", address: "3649 Boulevard Pl Indianapolis IN 46208", ownerName: "Mitchell Denise R", lienAmount: 1255.89, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-07-18-102-005.000-101", address: "907 N Tibbs Ave Indianapolis IN 46222", ownerName: "Williams Larry D", lienAmount: 3478.44, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-06-34-103-008.000-101", address: "1437 Sheldon St Indianapolis IN 46218", ownerName: "Jackson Brenda K", lienAmount: 1892.50, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-07-30-102-019.000-101", address: "2242 S Meridian St Indianapolis IN 46225", ownerName: "Perez Maria G", lienAmount: 5215.00, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-07-06-110-007.000-101", address: "3805 N Kenwood Ave Indianapolis IN 46208", ownerName: "Simmons David A", lienAmount: 987.25, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-11-07-139-017.000-101", address: "4226 E 10th St Indianapolis IN 46201", ownerName: "Nguyen Huy T", lienAmount: 3102.88, auctionDate: "2026-10-08", county: "Marion", state: "IN" },
  { parcelId: "49-06-25-106-022.000-101", address: "2630 N Park Ave Indianapolis IN 46205", ownerName: "Robinson Angela M", lienAmount: 2675.40, auctionDate: "2026-10-08", county: "Marion", state: "IN" },

  // --- Allen County (Fort Wayne) - 2026 Tax Sale ---
  { parcelId: "02-12-10-226-015.000-070", address: "1914 Winter St Fort Wayne IN 46803", ownerName: "Torres Miguel A", lienAmount: 2130.50, auctionDate: "2026-09-23", county: "Allen", state: "IN" },
  { parcelId: "02-12-10-431-008.000-070", address: "2821 S Hanna St Fort Wayne IN 46806", ownerName: "Crawford Lisa M", lienAmount: 4567.22, auctionDate: "2026-09-23", county: "Allen", state: "IN" },
  { parcelId: "02-12-11-304-019.000-070", address: "1227 Hugh St Fort Wayne IN 46803", ownerName: "Davis Raymond C", lienAmount: 1445.75, auctionDate: "2026-09-23", county: "Allen", state: "IN" },
  { parcelId: "02-12-03-228-006.000-070", address: "3410 Webster St Fort Wayne IN 46807", ownerName: "Kowalski Properties LLC", lienAmount: 7823.10, auctionDate: "2026-09-23", county: "Allen", state: "IN" },
  { parcelId: "02-12-10-306-011.000-070", address: "824 Cottage Ave Fort Wayne IN 46802", ownerName: "Phillips Mark E", lienAmount: 890.44, auctionDate: "2026-09-23", county: "Allen", state: "IN" },
  { parcelId: "02-12-11-127-003.000-070", address: "2145 S Lafayette St Fort Wayne IN 46803", ownerName: "Adams Tamika D", lienAmount: 3210.00, auctionDate: "2026-09-23", county: "Allen", state: "IN" },

  // --- St. Joseph County (South Bend) - 2026 Tax Sale ---
  { parcelId: "71-09-07-252-011.000-026", address: "1024 E Calvert St South Bend IN 46613", ownerName: "Nowak Stanley J", lienAmount: 2890.33, auctionDate: "2026-10-15", county: "St. Joseph", state: "IN" },
  { parcelId: "71-09-07-127-018.000-026", address: "622 S Taylor St South Bend IN 46601", ownerName: "Griffin Carol A", lienAmount: 1567.00, auctionDate: "2026-10-15", county: "St. Joseph", state: "IN" },
  { parcelId: "71-09-08-306-004.000-026", address: "1803 Linden Ave South Bend IN 46628", ownerName: "Hernandez Luis R", lienAmount: 4230.75, auctionDate: "2026-10-15", county: "St. Joseph", state: "IN" },
  { parcelId: "71-09-07-378-022.000-026", address: "415 S Chapin St South Bend IN 46601", ownerName: "Morris Debra L", lienAmount: 1120.88, auctionDate: "2026-10-15", county: "St. Joseph", state: "IN" },

  // --- Lake County (Gary/Hammond) - 2026 Tax Sale ---
  { parcelId: "45-08-33-178-006.000-014", address: "1845 Massachusetts St Gary IN 46407", ownerName: "Reed Anthony W", lienAmount: 1345.22, auctionDate: "2026-10-22", county: "Lake", state: "IN" },
  { parcelId: "45-08-33-290-015.000-014", address: "2207 Harrison St Gary IN 46407", ownerName: "Stewart Robert L", lienAmount: 890.10, auctionDate: "2026-10-22", county: "Lake", state: "IN" },
  { parcelId: "45-06-35-103-012.000-022", address: "6534 Columbia Ave Hammond IN 46320", ownerName: "Patel Rajesh K", lienAmount: 5678.90, auctionDate: "2026-10-22", county: "Lake", state: "IN" },
  { parcelId: "45-07-31-228-009.000-022", address: "1221 169th St Hammond IN 46324", ownerName: "Jenkins Loretta F", lienAmount: 3456.00, auctionDate: "2026-10-22", county: "Lake", state: "IN" },

  // --- Hamilton County (Noblesville/Carmel) - 2026 Tax Sale ---
  { parcelId: "29-11-17-000-028.000-018", address: "590 S 8th St Noblesville IN 46060", ownerName: "Burton Kenneth P", lienAmount: 8934.50, auctionDate: "2026-10-08", county: "Hamilton", state: "IN" },
  { parcelId: "29-11-20-000-044.000-018", address: "1825 Conner St Noblesville IN 46060", ownerName: "Fitzgerald Estates LLC", lienAmount: 12450.00, auctionDate: "2026-10-08", county: "Hamilton", state: "IN" },

  // --- Tippecanoe County (Lafayette) - 2026 Tax Sale ---
  { parcelId: "79-07-28-376-005.000-004", address: "1614 Union St Lafayette IN 47904", ownerName: "Cooper Shannon R", lienAmount: 2100.33, auctionDate: "2026-10-01", county: "Tippecanoe", state: "IN" },
  { parcelId: "79-07-28-253-012.000-004", address: "913 N 9th St Lafayette IN 47904", ownerName: "Morales Elena V", lienAmount: 1780.00, auctionDate: "2026-10-01", county: "Tippecanoe", state: "IN" },

  // --- Vigo County (Terre Haute) - 2026 Tax Sale ---
  { parcelId: "84-12-09-313-007.000-002", address: "1527 S 7th St Terre Haute IN 47802", ownerName: "Thompson Willie J", lienAmount: 1340.60, auctionDate: "2026-10-29", county: "Vigo", state: "IN" },
  { parcelId: "84-12-09-227-014.000-002", address: "820 Chestnut St Terre Haute IN 47807", ownerName: "Murphy Diane K", lienAmount: 2567.45, auctionDate: "2026-10-29", county: "Vigo", state: "IN" },

  // --- Howard County (Kokomo) - 2026 Tax Sale ---
  { parcelId: "34-04-30-404-017.000-002", address: "1414 S Berkley Rd Kokomo IN 46902", ownerName: "Dixon Marcus T", lienAmount: 1890.22, auctionDate: "2026-10-15", county: "Howard", state: "IN" },
  { parcelId: "34-04-30-281-009.000-002", address: "723 W Mulberry St Kokomo IN 46901", ownerName: "Barnes Patricia L", lienAmount: 3120.00, auctionDate: "2026-10-15", county: "Howard", state: "IN" },
  { parcelId: "34-04-19-377-003.000-002", address: "2205 N Washington St Kokomo IN 46901", ownerName: "Price George E", lienAmount: 945.80, auctionDate: "2026-10-15", county: "Howard", state: "IN" },

  // --- Monroe County (Bloomington) - 2026 Tax Sale ---
  { parcelId: "53-08-09-400-011.000-005", address: "1311 W 6th St Bloomington IN 47404", ownerName: "Walsh Timothy P", lienAmount: 4560.00, auctionDate: "2026-11-05", county: "Monroe", state: "IN" },
  { parcelId: "53-08-09-226-006.000-005", address: "819 N Rogers St Bloomington IN 47404", ownerName: "Sato Yuki M", lienAmount: 2234.75, auctionDate: "2026-11-05", county: "Monroe", state: "IN" },
];
