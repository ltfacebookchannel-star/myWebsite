import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // **التعديل الأهم هنا:**
  // base: './' يفرض على Vite استخدام مسارات نسبية للأصول (مثل: ./assets/...)
  // وهذا يحل مشكلة فشل تحميل ملفات JS/CSS وبالتالي ظهور الشاشة البيضاء.
  base: './',

  plugins: [react()],
})
