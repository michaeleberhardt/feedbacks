-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT 'Feedback Request',
    "introText" TEXT NOT NULL,
    "logoUrl" TEXT,
    "htmlDesign" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL DEFAULT 'Feedback Request: {reference}',
    "emailBody" TEXT NOT NULL DEFAULT '<div><p>Please provide your feedback.</p><p><a href="{link}">Click here</a></p></div>',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Template" ("createdAt", "htmlDesign", "id", "introText", "logoUrl", "title") SELECT "createdAt", "htmlDesign", "id", "introText", "logoUrl", "title" FROM "Template";
DROP TABLE "Template";
ALTER TABLE "new_Template" RENAME TO "Template";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
