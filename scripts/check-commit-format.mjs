import fs from "fs";

const msgFile = process.argv[2];

if (!msgFile) {
    console.error("❌ 错误：提交消息文件路径未提供");
    process.exit(1);
}

const msg = fs.readFileSync(msgFile, "utf8").trim();

const rule = /^(feat|fix|docs|chore|perf|refactor|style|test):\s.+/;

if (!rule.test(msg)) {
    console.error("❌ 提交格式不合法，必须是：<type>: <message>");
    process.exit(1);
}