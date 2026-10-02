# Network and Customer Tracking System — V16.1

این نسخه شامل تغییرات جدید Incident Network، Incident Customer، History، Task بالای صفحه و تغییر تم روز/شب است.

## Windows build
1. Node.js را نصب کنید.
2. PowerShell را داخل همین پوشه باز کنید.
3. اجرا کنید:
   `npm.cmd install`
4. سپس:
   `npm.cmd run build:setup`
5. فایل نصب داخل پوشه `dist` ساخته می‌شود.

## نکته
برای ورود Excel، برنامه از SheetJS CDN استفاده می‌کند؛ در حالت آفلاین کامل بهتر است کتابخانه XLSX نیز محلی بسته‌بندی شود.
