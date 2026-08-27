@echo off
cd /d "C:\Users\Lenovo ThinkPad T490\Desktop\ปิดรอบ 0"
echo ========================================================
echo  Deploying to Cloudflare Pages: front-office-scenery
echo ========================================================
npx wrangler pages deploy . --project-name front-office-scenery --branch main
echo.
echo ========================================================
echo  Done! Press any key to close.
echo ========================================================
pause
