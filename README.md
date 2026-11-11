# Hotel Clarks Amer Jaipur — Security Adjustment & ODC Tracker

Google Apps Script + Google Sheets web application starter for Security Department staff management.

## Current business requirements included

- Staff roster seed: 23 employees transcribed from the supplied staff list image.
- Employment categories: Onrole and Casual.
- Compensatory Off and Weekly Off adjustment requests.
- ODC event and venue tracking.
- ODC fixed cash rate: ₹500 for 8 hours = ₹62.50/hour.
- ODC amount calculation: entered duty hours × ₹62.50 (rounded to 2 decimals).
- Mandatory sequential approval: CSO first, then HR, for CO, Weekly Off and ODC requests.
- Approval notification destination: `raazchoudhary765@gmail.com`.
- ODC payment status and payment log; payment can be marked paid through the backend API only after final approval.
- Dashboard KPI data, staff directory, login roles and approval logs.
- App logo based on the hotel logo supplied in the conversation.

## Repository contents

- `Code.gs` — Apps Script backend.
- `Index.html` — Web app frontend.
- `appsscript.json` — Apps Script manifest.
- `database/CLARKS_AMER_SECURITY_DATABASE_TEMPLATE.xlsx` — Sheets-ready workbook with headers and seeded master data.
- `assets/clarks_amer_security_app_logo.png` — App icon/logo.
- `GITHUB_SETUP.md` — GitHub and deployment instructions.
- `docs/ODC_RATE_AND_APPROVAL_POLICY.md` — ODC calculation and approval flow.

## Setup

1. Create a Google Spreadsheet by importing the XLSX template in `database/`.
2. Open that spreadsheet and select **Extensions → Apps Script**.
3. Replace the default `Code.gs` with this repository's `Code.gs`.
4. Add an HTML file named exactly `Index` (Apps Script will create `Index.html`) and paste this repository's `Index.html`.
5. In Apps Script project settings, ensure the V8 runtime is enabled. The included `appsscript.json` is the manifest reference.
6. Run `setupDatabase()` once and authorize Google Sheets access.
7. Create accounts from the Apps Script editor using the helper examples below. Use strong unique passwords (minimum 12 characters):
   ```javascript
   createUserFromEditor_('admin_login', 'REPLACE_WITH_STRONG_PASSWORD', 'ADMIN', '', 'admin@hotel.example');
   createUserFromEditor_('cso_login', 'REPLACE_WITH_STRONG_PASSWORD', 'CSO', '', 'cso@hotel.example');
   createUserFromEditor_('hr_login', 'REPLACE_WITH_STRONG_PASSWORD', 'HR', '', 'hr@hotel.example');
   createUserFromEditor_('staff_login', 'REPLACE_WITH_STRONG_PASSWORD', 'STAFF', 'SEC-001', 'staff@hotel.example');
   ```
8. Deploy → New deployment → Web app. Select **Execute as: Me** and restrict access according to hotel IT policy.
9. Authorize MailApp when prompted. Test notifications, CSO approval, HR approval and payment records with dummy data before live use.

## Important

- GitHub is source-code storage; it does not itself host or run this Apps Script web app.
- `setupDatabase()` seeds the 23-person roster only when `STAFF_MASTER` has no staff rows. It does not overwrite an existing roster.
- Verify employee spellings, designations and employment categories with HR before production.
- The email configured in `Code.gs` is the approval notification recipient. The deploying Google account must authorize MailApp and have quota.
- The current starter has backend APIs for ODC payment marking, but a complete payment-marking screen, full PDF/Excel report UI, staff photo upload UI and production-grade audit/security review are not yet complete.
- Do not commit real passwords, private staff photos, or sensitive employee information to a public repository. Keep the repository Private.
