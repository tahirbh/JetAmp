@echo off
echo Building JetAmp APK...

cd app
echo 1. Building Web Assets...
call npm run build

echo 2. Syncing with Capacitor...
call npx cap sync android

echo 3. Building Android APK...
cd android
call ./gradlew assembleDebug

echo Build Complete! Your APK is at: app/android/app/build/outputs/apk/debug/app-debug.apk
pause
