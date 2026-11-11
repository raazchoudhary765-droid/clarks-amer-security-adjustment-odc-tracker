# GitHub upload and Apps Script deployment

## GitHub
1. Open the repository `clarks-amer-security-adjustment-odc-tracker`.
2. Choose **Add file → Upload files**.
3. Extract this ZIP on your computer first.
4. Upload the repository contents (not the ZIP file itself), preserving the `assets`, `database`, and `docs` folders.
5. Commit with message: `Add complete Security Adjustment and ODC Tracker starter`.

Recommended visibility: **Private**.

## Apps Script
Apps Script needs `Code.gs` and `Index.html` in the Apps Script project. Copy them from the repository root. The XLSX in `database/` is a template to import into Google Sheets; it is not an Apps Script source file.

GitHub does not automatically deploy changes to Google Apps Script. Deployment is performed from Apps Script, or later via `clasp` after configuring it.
