<!-- webvideo-compat: {"product":"terre","webgal":["4.6.4"]} -->
# WebVideo+ Terre 1.1.17

状态：未发布候选。适用 Terre / WebGAL 4.6.4、MyGO 3.2.1，并新增本线的 WebGAL LoveLive 接入。产品 1.1.17，安装器 1.1.17.0，导出内核 0.6.66，内部开发标识 0.8.16。本页汇总相对已公开 1.1.16 的改动；CI 成功不表示 Release、标签、下载资产或更新通道已经公开。

## LoveLive 接入与修复

- 整合 [PR #34](https://github.com/Stakataka-3030/WebVideo-Plus/pull/34) 的 LoveLive 适配，保留原作者提交及合并历史。贯通引擎识别、工程创建、3D 模型/动作读取、共享资源、依赖扫描与导出准备；支持实际使用的单 GLB 与 head/body 组合角色。普通 WebGAL / MyGO 不进入 LL 专属 glTF 帧等待。
- 角色读取仅在 LoveLive 工程中探测 3D 配置，失败时保留 Live2D 回退。预检明确报告缺失模型、非空默认动作、render profile、behavior 或 shader；只检查组合角色选中的 head/body，共享动作仍可回退到工程本地。资源递归在进入链接目录前拒绝操作。
- 修复真实 LL 模型在 planning 的 glTF 就绪屏障等待超时：只在任务副本实际导入的 offscreen-character 模块中，将一个 16 ms 准备 yield 和两个 10 ms shader poll 改用真实资源计时器。未知、歧义或重复补丁形态拒绝；不改原工程、剧情时钟、就绪条件或 120 秒超时。详见[资源计时修复](../verification/lovelive-resource-timers.md)。

## 导出与编辑

- 修复导出副本中已请求 Live2D 表情跨 await / destroy 的生命周期问题，只等待当前请求，不等待全量预取完成、不固定 sleep；真实 20 秒超时明确报错，保留失败缓存重选与原生重试。详见[表情安全说明](../LIVE2D-EXPRESSION-SAFETY.md)。
- 导出任务副本跳过游戏自动快速存档，正常游戏与手动存档保留。详见[自动存档修复](../AUTOSAVE-PLANNING.md)。
- 视频、舞台、对话框、音轨和 SRT 五类弹窗打开时仅被动查看现有预览状态，不自动重开预览；明确重读或真正提交时仍读取实际设置，需要打开预览前显示告知。关闭弹窗或切换项目后丢弃旧异步状态，POST 前失效不入队；已发出的 POST 不承诺取消。
- “仅本场景”（sceneOnly）保留前文与目标语句，在资源扫描、复制和媒体准备前保守裁去后文，用合成注释边界结束 planning，不执行 end 清场。详见[sceneOnly 尾部边界](../scene-only-tail.md)。
- ID 补全默认不覆盖已有 ID，多个在场候选时不猜测对白关联；角色出厂映射表及别名数据不改。共享素材显示可读库名，计时结果保留排队时的 sourceHash，允许来源的资源错误响应保留 CORS 头。
- Opus / Vorbis 循环标签贯通探测、规划与混音；循环后重建采样时间戳，避免以补静音掩盖输出短缺。离线预演与渲染保持静音。

## 安装与保存

- 便携安装位于默认收起的高级设置，默认关闭；保留常规安装、便携路径迁移与已安装模式锁。普通及便携安装均写入当前 runtime-session，FFmpeg 更新有界重试并可恢复旧工具。
- 新工程首次保存及空备份列表遇到 Nest 缺目录 500 时，先通过父目录 `dirInfo/isDir` 严格证明缺失。权限、畸形响应、文件占位和并发冲突仍拒绝操作，不吞未知错误。

## 验证范围

详见[1.1.17 候选验收](../verification/terre-1.1.17-candidate-20261110.md)，各候选与实际文件分列。

| 项目 | 结果与范围 |
| --- | --- |
| 精确源码 CI | `8680cfdb3f0303317e2a2288ad1df79beb481ab7` 的 [run 42779189109](https://github.com/Stakataka-3030/WebVideo-Plus/actions/runs/42779189109) 成功；此前 b4212502 的测试编译清单失败保留，不记为通过 |
| 原生回归 | WebGAL 4.6.4 JPEG readiness、captureFault、expressionContract、autosaveContract、autosave、scene-tail 通过；PNG 为 NA，冻结 4.6.4 产品不提供 PNG 兼容捕获 |
| 本地 Node / Nest | 357 通过、0 失败、1 个默认 opt-in Nest 跳过，真实 Nest 合同另行通过；整个 npm-cache 测试文件未在本机运行 |
| LL 真实模型成片 | 修复后的内部压缩包在隔离真实 LL 宿主完成同一双模型场景：720p30，500 帧，16.666667 秒，约 113.83 秒完成；全片解码与画面复核通过 |
| 安装与恢复 | 旧内部候选完成真实 LL 安装、重装、受控损坏修复、卸载原宿主恢复与再安装；资源 timer 修复后的新包完成实际隔离升级/安装与 GUI 排队导出，未重跑整套卸载矩阵 |
| 音频 | 8 组合成数值回归均为 96,000 样本。另以本地合成音频完成独立 LL 短场景：287 帧 / 9.566667 秒，AAC 同长，脉冲频率、两秒循环与五秒画面区间核验通过；不证明采样级停止或长片语音口型同步 |

LL 实测包为 `dist/WebVideo+-Setup-0.8.16-dev.exe`，97,357,824 字节，SHA-256 `84de89d14bebd1102a19dc1d26b17223ae3046f0cbb8e7a9a0e1ed4a08418549`，构建源码 `b4212502ab30b6437e1353f2be2c5cfaf78426e9`。`8680cfdb` 仅变更三份测试编译清单与文档，生产差异为空；不能将旧包改称由新 SHA 构建。

CI 保留的稳定通道安装器为 `WebVideo+-Setup-1.1.17.exe`，载荷身份记录 SHA-256 `b25beafc1d0b70ecca474f70ee8c556438d43c99f42d158ef84ec25d34f80ad9`。其 scene-tail 载荷核验不等同于该 EXE 的真实 LL 安装与运行验收，最终发行资产仍需取回、核验并记录。

## 保留的边界

sceneOnly 仅在自动 / 手动计时、无行范围选择且具备可裁尾边界时应用。analysisOnly、range、BGM-fit、非空自定义 musicTimeline、手动切点引用后文等情况保守回退；末场景保持原样。前文恢复、预热、锚点和取整方式不变，全文解析仍可能产生 HTML prefetch，不能承诺后文请求为零或显存降低；不足一帧的尾部声音不保证完全相同。

真实双模型样本的旧 demo 缺两个 lib 文件及默认 motion，修补仅发生在隔离输入副本；不宣称原 demo 开箱即用。旧包同输入两次 120 秒 glTF 超时保留为失败，修复未放宽屏障。当前最终包的 MyGO 真实宿主、完整约 24 分钟音视频、专有 Live2D SDK 像素、自动 anchor 策略和广泛模型库覆盖未完成，不承诺固定提速倍数。LL 接入仅在本线，Terre 4.6.6 和 Craft 的通用移植不包含 LL 引擎。

## 致谢与构建材料

感谢 [NijiharaTsubasa](https://github.com/NijiharaTsubasa) 的 LoveLive 适配工作，以及 planning 自动存档性能热点反馈与排障线索。

仅 CI 的依赖缓存补齐可回退至官方来源并按 SRI 校验，锁文件不变，不执行 lifecycle 脚本，不改用户 npm 或网络设置。固定 BtbN FFmpeg 与 7-Zip 的源码及许可获取说明见[第三方源码发行](https://github.com/Stakataka-3030/WebVideo-Plus/releases/tag/third-party-sources-ffmpeg-20260930-7zip-25.00)。
