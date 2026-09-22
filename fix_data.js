const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = "mongodb+srv://piyushchandr806_db_user:Piyush_2005@cluster0.sd00a60.mongodb.net/trip_management?retryWrites=true&w=majority&appName=Cluster0";

const passengersData = [
  { s: "1 L", n: "साहेब लाल चन्द्रा", f: "रामबगस चन्द्रा", a: 72, d: "मालखरौदा", g: "M", m: "0000000001", fam: "F_001" },
  { s: "2 M", n: "गंगा चन्द्रा", f: "साहेबलाल चन्द्रा", a: 59, d: "मालखरौदा", g: "F", m: "0000000002", fam: "F_001" },
  { s: "3 U", n: "सुनीता देवी चन्द्रा", f: "श्याम लाल चन्द्रा", a: 42, d: "भोथीडीह", g: "F", m: "7898506091", fam: "F_002" },
  { s: "4 L", n: "हरिहर प्रसाद", f: "रामभरोष चन्द्रा", a: 71, d: "गोबराभांठा", g: "M", m: "0000000004", fam: "F_003" },
  { s: "5 M", n: "नोनीगौटिन चन्द्रा", f: "हरिहर प्रसाद चन्द्रा", a: 62, d: "गोबराभांठा", g: "F", m: "0000000005", fam: "F_003" },
  { s: "6 U", n: "श्याम लाल चन्द्रा", f: "", a: 52, d: "भोथीडीह", g: "M", m: "7898506092", fam: "F_002" },
  { s: "7 SL", n: "हीरालाल पटेल", f: "कन्हैया लाल पटेल", a: 58, d: "बोतल्दा", g: "M", m: "9131538432", fam: "F_004" },
  { s: "8 SU", n: "सविता पटेल", f: "हीरालाल पटेल", a: 50, d: "बोतल्दा", g: "F", m: "9131538433", fam: "F_004" },
  { s: "9 L", n: "धनंजय चन्द्रा", f: "घनश्याम सिंह चन्द्रा", a: 53, d: "जैजैपुर", g: "M", m: "8435572072", fam: "F_005" },
  { s: "10 M", n: "राजेश्वरी चन्द्रा", f: "धनंजय चन्द्रा", a: 43, d: "जैजैपुर", g: "F", m: "6263066296", fam: "F_005" },
  { s: "11 U", n: "दिनेश कुमार पटेल", f: "राजाराम पटेल", a: 53, d: "रायपुर", g: "M", m: "0000000011", fam: "F_006" },
  { s: "12 L", n: "रिचा पटेल", f: "दिनेश पटेल", a: 47, d: "रायपुर", g: "F", m: "0000000012", fam: "F_006" },
  { s: "13 M", n: "नमिता पटेल", f: "दिनेश पटेल", a: 23, d: "रायपुर", g: "F", m: "0000000013", fam: "F_006" },
  { s: "14 U", n: "हुमिता पटेल", f: "दिनेश पटेल", a: 25, d: "रायपुर", g: "F", m: "0000000014", fam: "F_006" },
  { s: "15 SL", n: "लाल बहादुर चन्द्रा", f: "घनश्याम सिंह चन्द्रा", a: 56, d: "भिलाई", g: "M", m: "9424109855", fam: "F_007" },
  { s: "16 SU", n: "बोधराम चन्द्रा", f: "ननकीदाऊ चन्द्रा", a: 49, d: "रायपुर", g: "M", m: "0000000016", fam: "F_008" },
  { s: "17 L", n: "बलभद्र चन्द्रा", f: "सीताराम चन्द्रा", a: 49, d: "अमलीडीह", g: "M", m: "9827189309", fam: "F_009" },
  { s: "18 M", n: "हीरा बाई चन्द्रा", f: "बलभद्र चन्द्रा", a: 45, d: "अमलीडीह", g: "F", m: "9340237114", fam: "F_009" },
  { s: "19 U", n: "गुंजन चन्द्रा", f: "बलभद्र चन्द्रा", a: 12, d: "अमलीडीह", g: "F", m: "9340237115", fam: "F_009" },
  { s: "20 L", n: "सरिता चन्द्रा", f: "गिरजानंद चन्द्रा", a: 45, d: "झर्रा", g: "F", m: "7987645758", fam: "F_010" },
  { s: "21 M", n: "सागर बाई चन्द्रा", f: "रमेशक कुमार चन्द्रा", a: 45, d: "चांपा", g: "F", m: "9294690792", fam: "F_011" },
  { s: "22 U", n: "गिरजानंद चन्द्रा", f: "सेतराम चन्द्रा", a: 42, d: "झर्रा", g: "M", m: "7987645759", fam: "F_010" },
  { s: "23 SL", n: "भागवत साहू", f: "समारू राम साहू", a: 55, d: "मिरौनी", g: "M", m: "9752513653", fam: "F_012" },
  { s: "24 SU", n: "गायत्री साहू", f: "भागवत साहू", a: 54, d: "मिरौनी", g: "F", m: "9752513654", fam: "F_012" },
  { s: "25 L", n: "अजीत सिदार", f: "सवदराम सिदार", a: 35, d: "छपोरा", g: "M", m: "9131252602", fam: "F_013" },
  { s: "26 M", n: "पुष्पा सिदार", f: "अजीत सिदार", a: 35, d: "छपोरा", g: "F", m: "9131252603", fam: "F_013" },
  { s: "27 U", n: "विद्या सिदार", f: "अजीत सिदार", a: 14, d: "छपोरा", g: "F", m: "9131252604", fam: "F_013" },
  { s: "28 L", n: "पूर्णिमा जायसवाल", f: "ओमप्रकाश जाय.", a: 32, d: "छपोरा", g: "F", m: "7898878774", fam: "F_014" },
  { s: "29 M", n: "ओमप्रकाश जाय.", f: "साधारम जायसवाल", a: 35, d: "छपोरा", g: "M", m: "7898878775", fam: "F_014" },
  { s: "30 U", n: "बसंत चन्द्रा", f: "रामलाल चन्द्रा", a: 32, d: "छपोरा", g: "M", m: "9981119727", fam: "F_015" },
  { s: "33 L", n: "देवकुमारी चन्द्रा", f: "कमलेश चन्द्रा", a: 52, d: "कोरबा", g: "F", m: "7803804383", fam: "F_016" },
  { s: "34 M", n: "कमलेश चन्द्रा", f: "रामाधार चन्द्रा", a: 55, d: "कोरबा", g: "M", m: "7803804384", fam: "F_016" },
  { s: "35 U", n: "शीलू चन्द्रा", f: "रामकुमार चन्द्रा", a: 42, d: "किकिरदा", g: "F", m: "8959678214", fam: "F_017" },
  { s: "36 L", n: "ज्योति चन्द्रा", f: "भास्कर चन्द्रा", a: 41, d: "दतौद", g: "F", m: "9753409932", fam: "F_018" },
  { s: "37 M", n: "मंजू पटेल", f: "दिलीप कुमार पटेल", a: 38, d: "नवागांव", g: "F", m: "9753409933", fam: "F_019" },
  { s: "38 U", n: "भास्कर सिंह चन्द्रा", f: "सेतराम चन्द्रा", a: 42, d: "दतौद", g: "M", m: "9753409934", fam: "F_018" },
  { s: "39 SL", n: "आशुतोष चन्द्रा", f: "वंशीलाल चन्द्रा", a: 59, d: "सलनी", g: "M", m: "8349988236", fam: "F_020" },
  { s: "40 SU", n: "ललीता देवी चन्द्रा", f: "आशुतोष चन्द्रा", a: 57, d: "सलनी", g: "F", m: "8349988237", fam: "F_020" },
  { s: "41 L", n: "हेमलता शर्मा", f: "राजेन्द्र शर्मा", a: 63, d: "रायपुर", g: "F", m: "7898122375", fam: "F_021" },
  { s: "42 M", n: "डिम्पल चन्द्रा", f: "त्रिभुवन चन्द्रा", a: 30, d: "करिगांव", g: "F", m: "7999796386", fam: "F_022" },
  { s: "43 U", n: "लक्ष्मीन चन्द्रा", f: "रामप्यारे चन्द्रा", a: 50, d: "सक्ती", g: "F", m: "0000000043", fam: "F_023" },
  { s: "44 L", n: "रजनी शर्मा", f: "बजरंग प्रसाद शर्मा", a: 60, d: "डभरा", g: "F", m: "9981194114", fam: "F_024" },
  { s: "45 M", n: "कमला जायसवाल", f: "छोटेलाल जाय.", a: 60, d: "अम्बिकापुर", g: "F", m: "8224064934", fam: "F_025" },
  { s: "46 U", n: "अंजू ठाकुर", f: "प्रभु ठाकुर", a: 47, d: "अम्बिकापुर", g: "F", m: "8224064935", fam: "F_026" },
  { s: "47 SL", n: "निशा जायसवाल", f: "पुष्पेन्द्र जायसवाल", a: 32, d: "कांकेर", g: "F", m: "8103346165", fam: "F_027" },
  { s: "48 SU", n: "पुष्पेन्द्र जायसवाल", f: "विजय जायसवाल", a: 32, d: "कांकेर", g: "M", m: "8103346166", fam: "F_027" },
  { s: "49 L", n: "प्रमिला राठौर", f: "रामकुमार राठौर", a: 55, d: "किरारी", g: "F", m: "0000000049", fam: "F_028" },
  { s: "50 M", n: "शारदा राठौर", f: "गौतम राठौर", a: 40, d: "कोसमंदा", g: "F", m: "8435345042", fam: "F_029" },
  { s: "51 U", n: "रामकुमार राठौर", f: "", a: 62, d: "किरारी", g: "M", m: "9752801755", fam: "F_028" },
  { s: "52 L", n: "चन्द्रकला राठौर", f: "", a: 56, d: "कोसमंदा", g: "F", m: "0000000052", fam: "F_030" },
  { s: "53 M", n: "निर्मला राठौर", f: "", a: 50, d: "कोसमंदा", g: "F", m: "9836944608", fam: "F_030" },
  { s: "54 U", n: "गौतम राठौर", f: "", a: 45, d: "कोसमंदा", g: "M", m: "9826885709", fam: "F_029" },
  { s: "55 SL", n: "गोपाल साहू", f: "", a: 55, d: "खोखरा", g: "M", m: "8770207212", fam: "F_031" },
  { s: "56 SU", n: "असिल साहू", f: "गोपाल साहू", a: 52, d: "खोखरा", g: "F", m: "8770207213", fam: "F_031" },
  { s: "57 L", n: "गोपी सिंह ठाकुर", f: "विष्णु सिंह ठाकुर", a: 72, d: "करही", g: "M", m: "9340708705", fam: "F_032" },
  { s: "58 M", n: "भगतराम साहू", f: "श्याम लाल साहू", a: 52, d: "मुड़पार", g: "M", m: "9755932721", fam: "F_033" },
  { s: "59 U", n: "कृष्ण कुमार चन्द्रा", f: "शेषनारायण चन्द्रा", a: 39, d: "खम्हारडीह", g: "M", m: "9340977487", fam: "F_034" },
  { s: "60 L", n: "मधु सिंह ठाकुर", f: "गोपी सिंह ठाकुर", a: 65, d: "करही", g: "F", m: "9340708706", fam: "F_032" },
  { s: "61 M", n: "सुशीला साहू", f: "भुनेश्वर साहू", a: 52, d: "बरपाली", g: "F", m: "9827113169", fam: "F_035" },
  { s: "62 U", n: "भुनेश्वर साहू", f: "", a: 57, d: "बरपाली", g: "M", m: "9424170842", fam: "F_035" },
  { s: "63 SL", n: "अमृत लाल चन्द्राकर", f: "बिलासराम चन्द्राकर", a: 61, d: "रिसाली", g: "M", m: "9926602508", fam: "F_036" },
  { s: "64 SU", n: "पूर्वी चन्द्राकर", f: "अमृत लाल चन्द्राकर", a: 27, d: "रिसाली", g: "F", m: "9926602509", fam: "F_036" },
  { s: "65 L", n: "दयाशंकर राय मिश्रा", f: "गुरुचरण मिश्रा", a: 64, d: "हसौद", g: "M", m: "9993145780", fam: "F_037" }
];

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("trip_management");

    // ===== STEP 1: BACKUP =====
    console.log("--- STEP 1: Backing up current data ---");
    const currentPassengers = await db.collection("passengers").find().toArray();
    fs.writeFileSync("backup_passengers_745.json", JSON.stringify(currentPassengers, null, 2));
    console.log(`Backed up ${currentPassengers.length} passengers to backup_passengers_745.json`);

    const currentFamilies = await db.collection("families").find().toArray();
    fs.writeFileSync("backup_families.json", JSON.stringify(currentFamilies, null, 2));
    console.log(`Backed up ${currentFamilies.length} families`);

    const currentTrainAllocs = await db.collection("trainAllocations").find().toArray();
    fs.writeFileSync("backup_trainAllocations.json", JSON.stringify(currentTrainAllocs, null, 2));
    console.log(`Backed up ${currentTrainAllocs.length} trainAllocations`);

    // ===== STEP 2: DELETE CORRUPTED DATA =====
    console.log("\n--- STEP 2: Deleting corrupted data ---");
    const delPass = await db.collection("passengers").deleteMany({});
    console.log(`Deleted ${delPass.deletedCount} corrupted passengers`);

    const delFam = await db.collection("families").deleteMany({});
    console.log(`Deleted ${delFam.deletedCount} old families`);

    const delTrain = await db.collection("trainAllocations").deleteMany({});
    console.log(`Deleted ${delTrain.deletedCount} orphaned trainAllocations`);

    // ===== STEP 3: RE-IMPORT CLEAN DATA =====
    console.log("\n--- STEP 3: Re-importing clean data ---");

    // Create families first
    const familyMap = {};
    const uniqueFams = [...new Set(passengersData.map(p => p.fam))];
    
    for (const famCode of uniqueFams) {
      const members = passengersData.filter(p => p.fam === famCode);
      // Use the surname from the first member
      const surnames = members.map(p => p.n.split(" ").pop()).filter(Boolean);
      const commonSurname = surnames[0] || "Unknown";
      const familyId = "FAM_" + famCode;
      const familyName = commonSurname + " Family";
      
      familyMap[famCode] = familyId;
      
      await db.collection("families").insertOne({
        familyId: familyId,
        familyName: familyName,
        createdAt: new Date().toISOString()
      });
    }
    console.log(`Created ${Object.keys(familyMap).length} families`);

    // Create passengers and trainAllocations
    let passengerCount = 0;
    for (const p of passengersData) {
      const passengerId = "P" + String(passengerCount + 1).padStart(6, "0");
      
      // Parse seat info
      const seatParts = p.s.split(" ");
      const berthNumber = seatParts[0];
      const berthCode = seatParts[1];
      let berthType = "Unknown";
      if (berthCode === "L") berthType = "Lower";
      else if (berthCode === "M") berthType = "Middle";
      else if (berthCode === "U") berthType = "Upper";
      else if (berthCode === "SL") berthType = "Side Lower";
      else if (berthCode === "SU") berthType = "Side Upper";

      const gender = p.g === "M" ? "Male" : "Female";

      await db.collection("passengers").insertOne({
        passengerId: passengerId,
        name: p.n,
        age: p.a,
        gender: gender,
        relativeName: p.f,
        mobile: p.m,
        address: p.d,
        familyId: familyMap[p.fam],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await db.collection("trainAllocations").insertOne({
        passengerId: passengerId,
        coachNumber: "AC-3",
        berthNumber: berthNumber,
        berthType: berthType,
        updatedAt: new Date().toISOString()
      });

      passengerCount++;
    }
    console.log(`Imported ${passengerCount} clean passengers`);
    console.log(`Created ${passengerCount} trainAllocations`);

    // ===== VERIFY =====
    console.log("\n--- VERIFICATION ---");
    const finalCount = await db.collection("passengers").countDocuments();
    const finalFamilies = await db.collection("families").countDocuments();
    const finalAllocs = await db.collection("trainAllocations").countDocuments();
    console.log(`Passengers: ${finalCount}`);
    console.log(`Families: ${finalFamilies}`);
    console.log(`TrainAllocations: ${finalAllocs}`);

    // Show 3 sample passengers
    const samples = await db.collection("passengers").find().limit(3).toArray();
    console.log("\n--- SAMPLE PASSENGERS ---");
    samples.forEach((p, i) => {
      console.log(`[${i}] name: "${p.name}", age: ${p.age}, gender: ${p.gender}, rel: "${p.relativeName}", mobile: ${p.mobile}, address: "${p.address}", familyId: ${p.familyId}`);
    });

  } catch(e) {
    console.error("ERROR:", e);
  } finally {
    await client.close();
  }
}

run();
