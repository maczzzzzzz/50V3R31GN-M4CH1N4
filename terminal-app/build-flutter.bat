@echo off
pushd %~dp0
"F:\flutter-sdk\flutter\bin\flutter.bat" build apk --release
popd
