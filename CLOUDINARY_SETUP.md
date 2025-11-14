# Cloudinary Setup Instructions

## Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/
2. Click "Sign Up Free"
3. Create your account (free tier: 25GB storage, 25GB bandwidth)

## Step 2: Get Your Credentials
✅ **COMPLETED** - Your Cloud Name: `dgfqej8rp`

## Step 3: Create Upload Preset
1. Go to Cloudinary Dashboard: https://console.cloudinary.com/
2. Click **Settings** (gear icon) → **Upload** tab
3. Scroll to **Upload presets** → Click **Add upload preset**
4. Set:
   - **Preset name**: `miv1_receipts`
   - **Signing Mode**: **Unsigned**
   - **Folder**: `receipts`
   
5. Under **Generated public ID**:
   - ✅ Check: "Use the filename of the uploaded file as the public ID"
   
6. Under **Generated display name**:
   - ✅ Check: "Use the filename of the uploaded file as the asset's display name"
   
7. Under **Overwrite assets with the same public ID**:
   - ✅ Check this (optional - allows replacing old receipts)
   
8. Click **Save**

## Step 4: Update Your Code
✅ **COMPLETED** - Code already updated with:
- Cloud Name: `dgfqej8rp`
- Upload Preset: `miv1_receipts`

## Step 5: Test Upload
1. Run your app: `npm run dev`
2. Go to Payments screen
3. Click "Add Payment"
4. Fill the form
5. Upload a receipt (JPG, PNG, or PDF)
6. Submit the payment

## Features
✅ Upload receipts/proofs (JPG, PNG, PDF)
✅ Max file size: 10MB
✅ Optional upload (not required)
✅ Direct browser upload (no backend needed)
✅ 25GB free storage
✅ Files stored securely in Cloudinary

## File Organization
Files will be stored in your Cloudinary account:
- **Folder**: receipts (if configured)
- **Access**: Public URLs for download
- **CDN**: Fast delivery worldwide

## Security Notes
- Upload preset is "unsigned" (safe for frontend)
- No API secrets exposed in code
- Files are public but URLs are hard to guess
- Can add password protection later if needed

## File Deletion
**Important**: Files removed from your app remain in Cloudinary storage.

**Why?** Deleting from Cloudinary requires API Secret, which cannot be exposed in frontend code for security.

**Options:**
1. **Keep files** (Recommended): 25GB free storage, files serve as backup
2. **Manual cleanup**: Periodically delete old files from Cloudinary dashboard
3. **Backend solution**: Create a server endpoint with API Secret to handle deletions

**To manually delete files:**
1. Go to Cloudinary Dashboard → Media Library
2. Navigate to `receipts` folder
3. Select and delete unwanted files

## Optional: Add to Database
To save receipt URLs in database, update `paymentsService.createPayment()`:

```javascript
const newPayment = {
  memberId,
  amount,
  paymentMonth,
  paymentDate,
  paymentMethod,
  cashierName,
  receiptUrl  // Add this field
};
```

Then add `receipt_url` column to `payments` table in Supabase.

## Automatic File Replacement
When uploading a new receipt for the same member/month, the old file is automatically replaced if you enabled "Overwrite" in the upload preset settings.

## Support
- Cloudinary Docs: https://cloudinary.com/documentation
- Free tier limits: https://cloudinary.com/pricing
