# Interview Expression Coach Implementation Plan

**Goal:** 完成准备、首次诊断、引导重说与对比的本地 Web MVP。
**Architecture:** React 状态驱动三个视图；Express 代理模型与音频转录；AJV 严格验证输入和输出。无数据库、无生产 Mock、无多 Agent。
**Tech Stack:** React, Vite, TypeScript, Express, AJV, Node test, Playwright。
**Spec:** docs/spec.md

## Global Constraints
密钥仅在服务端；一轮一个缺口和追问；引用必须连续原文；二答兼顾原题与追问；未配置模型时明确报错；文本模式完整可用。

## Review Focus
空白和超长输入；不合法模型 JSON；伪造引文；录音失败与资源释放；第二次仅补充追问仍可获得有效评价。

## Tasks
- [x] server/contracts.mjs + schemas/*.json：定义独立输入、诊断、比较 Schema；测试额外字段、空白、长度和状态约束。
- [x] server/coach.mjs + prompts.mjs：可配置接口、超时、失败处理、引文校验；测试注入输入当数据处理、模型异常与二答上下文。
- [x] server/app.mjs：health、diagnose、compare、transcribe，内存音频 15MB 上限，无敏感日志；API 自动化测试。
- [x] src/App.tsx + Recorder.tsx + styles.css：三页闭环、可编辑转录、重试、草稿可选保存与清除、响应式布局。
- [x] tests/golden.json + natural.json + scripts/evaluate.mjs：保存黄金和自然对话数据，真实模型结果单独记录；无凭证时标记 SKIPPED。
- [x] tests/e2e.spec.ts：桌面和手机文本闭环（明确 Mock）、失败提示、清晰与不足状态。
- [x] README.md + docs/acceptance.md：构建和测试结果、启动方式、未验证能力与上线边界。

按用户明确指定顺序直接实现，不等待计划审核，不创建子代理。


验证限制：Playwright worker 受 EPERM 阻挡；已执行浏览器工具的实际交互替代检查。真实 LLM 和 ASR 未配置，不能标为验收通过。详情见 docs/acceptance.md。
