# ASR 验收 · 2026-11-17

服务：硅基流动，https://api.siliconflow.cn/v1/audio/transcriptions，模型 FunAudioLLM/SenseVoiceSmall。

已保留用户新填的密钥，并将 .env 中遗留的 OpenAI 默认地址和 whisper-1 模型同步为该服务配置。报告、命令输出与截图均不包含密钥。没有执行 Render 部署。

## 真实服务测试

1. WAV：使用已生成的 Windows 中文合成音频，参考文本为“我负责梳理需求，协调研发修复问题，并在上线前完成测试。”真实 ASR 完整转出原句。结果见 docs/evaluation/asr.json。
2. 浏览器：已有 Edge 的假麦克风读取同一合成音频，通过实际页面的开始录音、停止录音、转为文字，调用本地 /api/transcribe，再由服务端请求真实 ASR。HTTP 200，转录含“需求”“研发”“测试”；可编辑并保留修改；393×852 视口无横向溢出；无页面 JS 错误。结果见 docs/evaluation/asr-browser.json。
3. 浏览器假麦克风循环播放参考音频，测试录音长度为 11 秒，因此返回文字末尾出现下一轮的部分内容，这是测试音源循环造成的，不把该结果当作逐字准确率测评。

没有录制用户实际声音，未将此项表述为 iPhone Safari 真机认证。真实麦克风权限、不同口音、背景噪声及 iOS Safari 应在实际设备补充检查。当前本地服务已重启并加载 ASR 配置。

## 复测

在 E:\AI20261112 执行：

```powershell
node --env-file-if-exists=.env scripts/check-asr.mjs
# 先启动本地应用，确保 3001 可用，再运行浏览器真实 ASR 测试：
node --env-file-if-exists=.env scripts/check-asr-browser.mjs
```

第二条需已安装的 Edge，使用合成文件 work/asr-check.wav。浏览器测试的 TEMP、TMP 应指向项目 work/tmp，防止产生新的 C 盘临时缓存。两条命令都会调用所配置的外部语音服务，额度和计费以服务商账户为准。
