import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

/**
 * Optional Data Audit & Repair Script for SGS-NEXT-STEP
 * Default mode: DRY RUN (read-only, does not modify any data).
 * To perform repairs: run with --fix flag.
 */
async function auditData() {
    const isFixMode = process.argv.includes("--fix");

    console.log("=== SGS-NEXT-STEP Counselor Data Audit ===");
    console.log(`Mode: ${isFixMode ? "LIVE REPAIR (--fix active)" : "DRY RUN (read-only inspect)"}\n`);

    if (!process.env.DATABASE_URI) {
        console.error("Error: DATABASE_URI is not set in environment.");
        process.exit(1);
    }

    await mongoose.connect(process.env.DATABASE_URI);
    const db = mongoose.connection.db;

    const counselors = await db.collection("counselors").find().toArray();
    console.log(`Found ${counselors.length} total counselor documents in DB:\n`);

    const orphanCounselors = [];
    const validCounselors = [];

    for (const c of counselors) {
        let userDoc = null;
        if (c.user) {
            userDoc = await db.collection("users").findOne({ _id: c.user });
        }

        const hasValidUser = userDoc !== null;
        const hasDirectName = Boolean(c.name && c.name.trim().length > 0);

        if (!hasValidUser && !hasDirectName) {
            orphanCounselors.push({ counselor: c, reason: "user reference deleted and no direct name specified" });
            console.log(`[ORPHAN] Counselor ID ${c._id}: User Ref ${c.user} does not exist in users collection. Status: ${c.status}`);
        } else {
            validCounselors.push({ counselor: c, user: userDoc });
            console.log(`[VALID]  Counselor ID ${c._id}: ${userDoc ? userDoc.name + ' (' + userDoc.email + ')' : c.name} | Status: ${c.status}`);
        }
    }

    console.log(`\nAudit Summary:`);
    console.log(`- Valid Counselors: ${validCounselors.length}`);
    console.log(`- Orphan / Ghost Counselors: ${orphanCounselors.length}`);

    if (orphanCounselors.length > 0) {
        if (isFixMode) {
            console.log(`\n[FIX MODE] Removing ${orphanCounselors.length} orphan counselor document(s)...`);
            for (const item of orphanCounselors) {
                await db.collection("counselors").deleteOne({ _id: item.counselor._id });
                console.log(`  ✓ Removed orphan counselor ${item.counselor._id}`);
            }
            console.log("Cleanup complete.");
        } else {
            console.log(`\n[DRY RUN] No changes were made. To remove these orphan counselor documents, run:`);
            console.log(`  node scripts/audit_counselor_data.js --fix`);
        }
    } else {
        console.log("\nAll counselor records are valid and consistent.");
    }

    await mongoose.connection.close();
    process.exit(0);
}

auditData().catch((err) => {
    console.error("Audit error:", err);
    process.exit(1);
});
