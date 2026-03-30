import fs from "fs";

const inputPath = "./keys/www.youtube.com_cookies.txt";
const outputPath = "./keys/cookies.base64.txt";

fs.mkdirSync("./keys", { recursive: true });
const cookies = fs.readFileSync(inputPath);

if (!cookies.length) {
    throw new Error("Cookies file is empty");
}

const base64 = Buffer.from(cookies).toString("base64");

fs.writeFileSync(outputPath, base64);

console.log("Cookies encoded successfully");