import fs from 'fs';

const content = fs.readFileSync('d:/Visual Studio/swd_fe/src/screens/EnrollFaceScreen.tsx', 'utf8');
let depth = 0;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') depth++;
        if (line[j] === '}') depth--;
        if (depth < 0) {
            console.log(`Mismatch at line ${i + 1}, col ${j + 1}`);
            process.exit(1);
        }
    }
}

console.log(`Final depth: ${depth}`);
if (depth !== 0) {
    console.log("Mismatched braces at end of file");
}
