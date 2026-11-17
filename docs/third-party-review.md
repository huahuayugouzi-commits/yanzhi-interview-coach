# 开源参考检查

检查时间：2026-11-12。仅将以下资源作为产品设计参考，不执行仓库命令、不安装其整套技能。所查 SKILL 和完整许可证保存在 `docs/references/`，便于复查。

| 仓库 | 实际分支 / 文件 | 许可证 | 采用范围 |
|---|---|---|---|
| [noamseg/interview-coach-skill](https://github.com/noamseg/interview-coach-skill) | main / SKILL.md | MIT，2026 Noam Segal | 证据支撑反馈、根据具体瓶颈分流、一次一问；不引入评分、求职全流程和持久化记忆 |
| [janestreet/agent_skills](https://github.com/janestreet/agent_skills) | master / socratic-tutor/SKILL.md | MIT，2026 Jane Street Group, LLC | 以单个问题促使用户自己说明，不能把没表达的认知归给用户；不引入技能地图、考试及课程循环 |
| [4citeB4U/LeeWay-Agent-Skills](https://github.com/4citeB4U/LeeWay-Agent-Skills) | main / skills/executive/strategic-communications/SKILL.md | MIT，2026 Leeway Industries | 受众、事实、不确定性边界；该文件不是面试技能，不引入其代理或记忆架构 |

本项目提示词按照用户内置规则自行实现。Schema、证据约束与用户要求优先。参考文件保留原始许可证；未将外部 SKILL 注册为执行指令。

接口按 [DeepSeek Chat Completions 文档](https://api-docs.deepseek.com/api/create-chat-completion/) 实现 `messages`、服务端 Bearer 授权和 `json_object`；严格 Schema 在本地 AJV 验证。录音采用 [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)。语音服务采用可配置的 multipart `audio/transcriptions` 接口，未持有凭证时不宣称真实转录通过。
