call npm run document
call npm run clean
call tsc
copy package.json %cd%\dist
copy README.md %cd%\dist
PAUSE