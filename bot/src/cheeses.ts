import fs from 'fs';
export const cheeses = JSON.parse(fs.readFileSync("./cheeses.json").toString())
