@echo off
setlocal

REM Check if version is provided
if "%1"=="" (
  echo Error: Version number is required
  echo Usage: scripts\release\generate-release-notes.bat ^<version^>
  exit /b 1
)

set VERSION=%1
for /f "tokens=*" %%a in ('git describe --tags --abbrev=0 2^>nul') do set PREV_TAG=%%a
for /f "tokens=*" %%a in ('date /t') do set RELEASE_DATE=%%a

REM Create release notes file with template
(
echo # EVAPOTRAN %VERSION% Release Notes
echo ## Release Date: %VERSION% ^(%RELEASE_DATE%^)
echo ## Overview
echo This release adds several improvements to the EVAPOTRAN calculator.
echo.
echo ## Key Features
echo - **Feature 1**: Description
echo - **Feature 2**: Description
echo.
echo ## Installation
echo EVAPOTRAN is a client-side web application that can be run locally or deployed to a web server.
echo.
echo ## Known Limitations
echo 1. Limitation 1
echo 2. Limitation 2
echo.
echo ## Feedback and Contributions
echo We welcome feedback and contributions to improve EVAPOTRAN.
echo.
echo ## License
echo EVAPOTRAN is licensed under the GNU General Public License v3.0.
) > RELEASE_NOTES.md

echo Release notes template generated in RELEASE_NOTES.md
echo Please edit the file to add detailed information about the release.