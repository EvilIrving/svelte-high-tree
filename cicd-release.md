# 版本管理

当前版本是: 1.1.0

新增 main 分支作为主分支，改 master 分支为 init 分支

## 语义化

- **alpha**：功能没定型，随时可能回炉。
- **beta**：功能稳定，找 bug。
- **rc**（release candidate）：可以发正式版了，除非发现阻断级 bug。

## Tag 标准

- 1.1.0-alpha.1
- 1.1.0-alpha.2
- 1.1.0-beta.1
- 1.1.0-rc.1
- 1.1.0

## 分支标准

- **main**：真正上线的东西
- **release/X.Y.Z**：准备发版的地方
- **feature/xxx**：每个新功能一个分支
- **hotfix/xxx**：缺陷分支

## 开发流程

```bash
git checkout -b feature/xxx main
```

## 准备发布

```bash
git checkout -b release/x.y.z main
```

合并所有 feature 进去

## 正式发布

```bash
release/x.y.z → main
```

## 官方 Tag

```bash
git tag x.y.z
git push --tags
```

---

# CI/CD

## 学习 CI/CD 需要

### .gitlab-ci.yml

- **pipelines**：多个 stage 组成，按顺序执行
- **stages**：阶段顺序和名称，阶段内的 job 默认并行执行
- **jobs**：最小执行单元，必须有唯一名称，包含 script 部分运行命令
  - **script**：Shell 脚本命令
  - **stage**：分配阶段
  - **images**：指定运行环境
  - **rules**：定义运行规则
  - **only/except**：定义运行条件/除外条件
  - **variables**：定义变量
- **pages**：预定义的 jobs，激活 GitLab Pages
- **include**：引入外部配置
- **CICD components**
- **needs 关键字**

## Tips

- 使用 extends 和 YAML 锚点（Anchors）
- cache 和 artifacts
- rules vs only/except
- interruptible 关键字
- 使用 before_script 和 after_script
- 使用 dependencies 关键字精确控制构建产物下载
- 使用 `default` 关键字指定应用于所有作业的额外配置

## 环境变量

- **$CI_COMMIT_TAG**：获取当前 tag 名称
- **$CI_COMMIT_REF_NAME**：获取当前分支名称
- **$CI_PIPELINE_ID**：获取当前流水线 ID
- **$CI_JOB_ID**：获取当前 job ID
- **$CI_COMMIT_SHORT_SHA**：获取当前 commit 的短 SHA 值
- **$CI_PROJECT_NAME**：获取项目名称
- **$GITLAB_USER_NAME**：获取触发流水线的用户名称

### 参考文档

- [预定义变量](https://docs.gitlab.com/ci/variables/predefined_variables/)
- [Reference](https://docs.gitlab.com/ci/yaml/)

## CI JOB 执行流程

1. Runner 起一个干净环境
2. 拉代码
3. 恢复 cache（可能有）
4. 执行 before_script：安装依赖、配置
5. 执行 script：主要构建任务
6. 执行 after_script：发通知/清理
7. 上传 artifacts
8. 更新 cache

### Cache 配置

Cache 不保证是存在的，后续 job 会匹配 key 看是否存在，存储在 GitLab 的对象存储里。

```yaml
cache:
  key:
    files:
      - pnpm-lock.yaml
  paths:
    - .pnpm-store/

before_script:
  - corepack enable
  - pnpm install --frozen-lockfile
```

### Artifacts

Artifacts 保存 job 的产物，后续 job 通过 needs 继承他的环境，进而使用 artifacts。

### inputs/include

inputs/include 是跨项目使用 ci templates 的关键，定义单独的 ci 模版库项目，其他项目通过 includes 引入，通过传值不同实现不同的构建参数。如果项目间的 ci 流程差异过大或者只有一两个项目，则不太需要。

inputs 是 ci 编译 yaml 阶段处理的，variables 是 ci 执行阶段。

---

# Shell 脚本和命令

## 常用命令

- echo
- chmod
- ls
- cd
- pwd
- mkdir
- cp
- rm
- mv
- touch
- cat
- tail -f log
- grep
- ping
- ps
- kill
- df
- du
- top

## 高级命令

- awk
- sed
- find
- cut
- tar
- curl

---

# Agent-Code 优化

## Tree 筛选速度

### 需求说明

要在数万节点的 tree 做到节点可搜索、复选框（全选/半选）、展开节点不卡顿，高性能。

### 技术栈

项目采用 Vue3 + TS + vite + pinia 技术栈，虚拟化和懒加载 intersection-observer API 实现，不必用第三方库。

### 接口目前的返回值实例

```json
[
    {
        "id": "string",
        "name": "string",
        "parentId": "string | null"
    },
    {
        "id": "string",
        "name": "string",
        "parentId": "string | null"
    }
]
```

## Tree 差分更新

### 目录树状态同步

我们有一个 agent-chat 项目，实现对用户提供的系统文件资源进行检索数据，AI 执行任务回答。中间过程需要输出 markdown、excel 文件等，存在目录结构。目录结构被渲染为树，渲染过程中，我们会进行压缩（如果目录 a 下只有一个 b 目录，且 b 目录下存在文件，则合并为 a/b；如果 b 目录下仍然只有一个 c 目录，且 c 目录下有文件，则合并为 a/b/c）。

随着过程文件的不断产生，目录结构可能会变动。原本 a 下面只有一个 b 目录会合并，后面随着生成了 e 目录，且 e 目录是 a 目录下面和 b 同级，那么就不再合并了。

目前的实现是基于开源 UI 库，tree 结构会直接重置。我希望利用前面的概念进行优化，自行实现一个能差分更新、增量更新的 tree。

### 接口输出

```json
[
    {
        "type": "file",
        "name": "some.md",
        "id": "xxxx",
        "parent": [
            {
                "type": "folder",
                "name": "dirA",
                "id": "aaa"
            },
            {
                "type": "folder",
                "name": "dirB",
                "id": "bbb"
            },
            {
                "type": "folder",
                "name": "dirC",
                "id": "ccc"
            }
        ]
    },
    {
        "type": "file",
        "name": "some.excel",
        "id": "ddd",
        "parent": [
            {
                "type": "folder",
                "name": "dirA",
                "id": "aaa"
            },
            {
                "type": "folder",
                "name": "dirB",
                "id": "bbb"
            }
        ]
    }
]
```

## Worker 优化

- WASM 处理更多逻辑

## UniverJS 优化 Excel 渲染

### 读取 Excel（用 SheetJS）后，计算 usedRange

```javascript
const sheet = workbook.Sheets[sheetName];
const range = XLSX.utils.decode_range(sheet['!ref']);
// range.s.r ~ range.e.r  是有效数据的行范围
// range.s.c ~ range.e.c  是有效数据的列范围
```

比如只有一行内容，那 range.e.r 就是 0。

### 初始化 UniverJS 时，设置

```javascript
univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
  sheets: {
    "sheet1": {
      rowCount: range.e.r + 1,
      columnCount: range.e.c + 1,
      cellData: parsedData, // 你的数据
    }
  }
});
```

### 效果

- UniverJS 渲染区域 = 实际有数据的区域
- 空白的 100 万行 → 不会进入渲染流程

### 预留缓冲区

你可以额外"多渲染一点"，比如预留 100 行：

```javascript
rowCount: range.e.r + 1 + 100
```

### 参考

[SheetJS 文档](https://docs.sheetjs.com/docs/getting-started/examples/import)

## 接口调改不完全加载

优化 svelte tree
表格 map ： 单独做一个视图
table 单元格用事件委托，不要在每个单元格上添加点击事件。
