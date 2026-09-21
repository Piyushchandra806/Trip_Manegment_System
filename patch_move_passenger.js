const fs = require('fs');

// 1. Patch Backend Route
let apiContent = fs.readFileSync('app/api/admin/families/change/route.js', 'utf8');
apiContent = apiContent.replace(
  `const { targetMobile, targetFamilyId } = await request.json();

    if (!targetMobile || !targetFamilyId) {`,
  `const { passengerId, targetFamilyId } = await request.json();

    if (!passengerId || !targetFamilyId) {`
);
apiContent = apiContent.replace(
  `const passenger = await db.collection("passengers").findOne({ mobile: targetMobile, adminId: admin.adminId });`,
  `const passenger = await db.collection("passengers").findOne({ passengerId: passengerId, adminId: admin.adminId });`
);
fs.writeFileSync('app/api/admin/families/change/route.js', apiContent);

// 2. Patch Frontend Page
let pageContent = fs.readFileSync('app/admin/families/page.js', 'utf8');
pageContent = pageContent.replace(
  `      body: JSON.stringify({ 
        mobile: moveModal.passenger.mobile, 
        newFamilyId: moveModal.newFamilyId 
      })`,
  `      body: JSON.stringify({ 
        passengerId: moveModal.passenger.passengerId, 
        targetFamilyId: moveModal.newFamilyId 
      })`
);
fs.writeFileSync('app/admin/families/page.js', pageContent);

console.log("Patched successfully");
