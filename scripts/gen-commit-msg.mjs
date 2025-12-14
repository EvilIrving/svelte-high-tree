import fs from "fs";
import { execSync } from "child_process";
import "dotenv/config";

const path = process.argv[2];

if (!path) {
    console.error("❌ 错误：提交消息文件路径未提供");
    process.exit(1);
}

const content = fs.readFileSync(path, "utf8");

// 去掉注释行
const userContent = content
    .split("\n")
    .filter(line => !line.trim().startsWith("#"))
    .join("")
    .trim();

if (userContent) {
    // 用户真的写了内容
    console.log("检测到用户已输入提交信息，跳过 AI 生成");
    process.exit(0);
}


const diff = execSync("git diff --cached", { encoding: "utf8" });

if (!diff.trim()) {
    process.exit(0);
}

async function main() {
    try {
        const message = await generateCommitMessage(diff);
        fs.writeFileSync(path, message + "\n");
    } catch (e) {
        console.error("❌ AI 生成 commit message 失败：", e.message);
    }
}

async function generateCommitMessage(diff) {
    const url = process.env.AI_API_URL;
    const key = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL;

    if (!url || !key || !model) {
        console.error("❌ 缺少 AI 配置，请检查 .env 文件");
        return "chore: update";
    }

    const body = {
        model: model,
        messages: [
            {
                role: "system",
                content: `你是一个 git 提交信息生成器。严格遵守以下规则：
1. 输出格式：<type>: <title> 或 <type>: <title>\n\n<body>
2. type 必须从以下选项中选择：feat|fix|docs|chore|style|refactor|perf|test
3. title 必须简短精炼，不超过 80 个字符
4. body 是可选的，仅在 diff 内容复杂、需要补充说明时添加
5. 如果需要 body，应将变更内容分点列出，每个要点简洁明了
6. 输出纯文本，不要使用代码格式标记`
            },
            {
                role: "user",
                content: `基于下面的 git diff 生成提交信息：\n${diff}`
            }
        ]
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify(body)
    });

    console.log("AI API 响应：", res.status, res.statusText);


    const data = await res.json();

    const msg = data.choices?.[0]?.message?.content?.trim();
    return msg || "chore: update";
}

await main();