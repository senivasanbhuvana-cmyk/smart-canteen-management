@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d "C:\Users\Bhuvaneswari\OneDrive\Desktop\smart-canteen-management\backend-java"
echo Starting SmartBite Java Backend on port 5000...
java -jar target\smartbite-backend-1.0.0.jar
pause
