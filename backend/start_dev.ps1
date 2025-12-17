$NodePath = Resolve-Path "$PSScriptRoot\..\tools\node-v25.2.1-win-x64"
$env:PATH = "$NodePath;$env:PATH"
echo "Starting Backend with Node from: $NodePath"
npm run dev
