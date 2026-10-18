import os
import shutil
import base64
import cv2

def b64_webp(img_bgr, quality=75, max_w=750):
    h, w = img_bgr.shape[:2]
    if w > max_w:
        new_w = max_w
        new_h = int(h * (new_w / w))
        resized = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)
    else:
        resized = img_bgr
    success, enc = cv2.imencode('.webp', resized, [cv2.IMWRITE_WEBP_QUALITY, quality])
    if not success:
        raise ValueError("WebP encoding failed")
    b64_str = base64.b64encode(enc.tobytes()).decode('utf-8')
    return f"data:image/webp;base64,{b64_str}"

def b64_crop(img_bgr, quality=80):
    success, enc = cv2.imencode('.webp', img_bgr, [cv2.IMWRITE_WEBP_QUALITY, quality])
    b64_str = base64.b64encode(enc.tobytes()).decode('utf-8')
    return f"data:image/webp;base64,{b64_str}"

# Ensure output directories exist
os.makedirs('frontend/public/outputs/processed', exist_ok=True)
os.makedirs('frontend/public/outputs/crops', exist_ok=True)

# Process Stage 1, 2, 3
img1 = cv2.imread('outputs/processed/DOLIL_2001_20078_stage1_anonymized.png')
img2 = cv2.imread('outputs/processed/DOLIL_2001_20078_stage2_shadow_removed.png')
img3 = cv2.imread('outputs/processed/DOLIL_2001_20078_stage3_clean_binarized.png')

# Save optimized files to public as well
cv2.imwrite('frontend/public/outputs/processed/DOLIL_2001_20078_stage1_anonymized.png', img1)
cv2.imwrite('frontend/public/outputs/processed/DOLIL_2001_20078_stage2_shadow_removed.png', img2)
cv2.imwrite('frontend/public/outputs/processed/DOLIL_2001_20078_stage3_clean_binarized.png', img3)

s1_data = b64_webp(img1, quality=75)
s2_data = b64_webp(img2, quality=75)
s3_data = b64_webp(img3, quality=75)

crops_names = [
    'stamp_serial_no',
    'stamp_duty_math',
    'copy_issue_date',
    'registration_date',
    'deed_number_year',
    'deed_type_and_value',
    'land_area',
    'location_mouza_thana'
]

crops_dict = {}
for c in crops_names:
    p = os.path.join('outputs/crops', f'DOLIL_2001_20078_{c}.png')
    if os.path.exists(p):
        crop_img = cv2.imread(p)
        cv2.imwrite(os.path.join('frontend/public/outputs/crops', f'DOLIL_2001_20078_{c}.png'), crop_img)
        crops_dict[c] = b64_crop(crop_img)

js_content = f'''// Auto-generated offline & cloud embedded deed assets
// BhumiLens AI + BhumiGuard — LandTech Innovation Hackathon 2026

export const demoDeedAssets = {{
  stage1_anonymized: "{s1_data}",
  stage2_shadow_removed: "{s2_data}",
  stage3_clean_binarized: "{s3_data}",
  crops: {{
'''

for k, v in crops_dict.items():
    js_content += f'    {k}: "{v}",\n'

js_content += '''  }
};

export default demoDeedAssets;
'''

with open('frontend/src/assets/demoDeedAssets.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

file_size_kb = round(os.path.getsize('frontend/src/assets/demoDeedAssets.js') / 1024, 1)
print(f"Generated demoDeedAssets.js successfully! File size: {file_size_kb} KB")
