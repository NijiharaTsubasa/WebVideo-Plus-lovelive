
# Terre 1.1.17 发布前候选核验（2026-11-10）

发布状态：已于 2026-11-10 发布：[v1.1.17](https://github.com/Stakataka-3030/WebVideo-Plus/releases/tag/v1.1.17)。以下保留发布前验收记录；旧候选、内部包与失败记录不代表公开安装器的验收。

发布前状态：候选。产品 1.1.17 / 安装器 1.1.17.0 / 导出内核 0.6.66 / 内部标识 0.8.16。本文区分早期内部候选、资源计时修复包和 CI 稳定通道载荷，不将不同文件的测试互相替代。测试素材、模型、截图、视频和浏览器 profile 均留在隔离证据目录，不随文档提交。

## 源码与产物身份

| 对象 | 来源与身份 |
| --- | --- |
| 当前已测源码 | [`8680cfdb3f0303317e2a2288ad1df79beb481ab7`](https://github.com/Stakataka-3030/WebVideo-Plus/commit/8680cfdb3f0303317e2a2288ad1df79beb481ab7)；[CI 42779189109](https://github.com/Stakataka-3030/WebVideo-Plus/actions/runs/42779189109) 成功 |
| LL 实测内部安装器 | `dist/WebVideo+-Setup-0.8.16-dev.exe`，97,357,824 字节，SHA-256 `84de89d14bebd1102a19dc1d26b17223ae3046f0cbb8e7a9a0e1ed4a08418549`；正常分组压缩，`InternalBuild`，不是 stable 通道 |
| 内部包构建源码 | `b4212502ab30b6437e1353f2be2c5cfaf78426e9`。其后 `8680cfdb` 仅变更三个测试编译清单和验证文档，生产 diff 为空；`.build/ll-resource-timers-candidate/production-equivalence.json` 记录核对结果，不能把原包标成由 `8680cfdb` 构建 |
| 内部包 manifest / 内核 | manifest SHA-256 `285727a4a74e131f98acbf08c9a187ace10463553a255d37377f30f0ed76b0ed`；内核 `cbf6c67b4029bcc58e19290750637e92db51e40eac357cecfbd999c7e651d90f` |
| CI 保留稳定安装器 | `WebVideo+-Setup-1.1.17.exe`，SHA-256 `b25beafc1d0b70ecca474f70ee8c556438d43c99f42d158ef84ec25d34f80ad9`；artifact `13745424753` 已存在，尚未取回确认为最终发行文件 |
| CI 正式载荷 | manifest `f65301c9edd19d017162b1d23cd49711ce4965c6fb889de7aa20f3df63c6c87f`；内核 `b9ffdb7031bc05830a398b2e1458b13b690516b9d3f9a99e331a2e2b9372165f`；6817 文件完整核验；`installerExecuted=false`，不能写为该稳定 EXE 的真实 LL 安装验收 |

## CI 与本地回归

- 精确源码 CI 的 WebGAL 4.6.4 JPEG readiness、captureFault、expressionContract、autosaveContract 和 autosave 全部 PASS。PNG 明确为 NA，原因是冻结 4.6.4 产品不提供 PNG 兼容捕获。
- scene-tail 原生像素、PCM 和并发 renderer 门槛通过，使用 CI 保留的正式安装器载荷。`scene-tail/package-identity.json` 中 sourceCommit 为 `8680cfdb` 完整 SHA，`fullManifestVerified=true`。这不是 LoveLive 引擎或专有 Live2D SDK 的像素证明。
- `native-results.json` 的 11 组原生检查通过，包含生命周期、便携安装、私有文件、持久化、进程输出和导出诊断。CI 图形结果及每个 scene-tail summary 保留在 CI artifact；离线复核副本为同级 `ci-review-20261110/42779189109/`。
- 历史 [CI 42778603842](https://github.com/Stakataka-3030/WebVideo-Plus/actions/runs/42778603842) 在 `b4212502` 因 glTF 独立 Add-Type 编译清单缺少资源 timer 依赖而失败；同时修正 resource-url-scan 与 scene-only-tail 清单。保留该失败，本地追加 glTF 22、资源 114、scene-tail 97 项通过，不改变生产字节。
- 修复包本地 Node 为 357 通过、0 失败、1 项默认 opt-in Nest 跳过。整个 `ci-npm-cache.test.mjs` 文件因既有网络限制未运行，不绕过限制。真实 Nest 合同此前单独通过；该合同使用官方 4.6.6 Nest 通用 API 与本线解析器，不替代 LL 宿主 GUI。
- 首次保存修复通过父目录 `dirInfo/isDir` 确认缺失，覆盖新目录首次保存、中文/零宽字符保真、备份读取和并发冲突；不吞未知 500，不放宽权限。
- PCM / Opus / Vorbis、48 kHz / 44.1 kHz、0 / 700 ms 偏移共 8 组合成音频回归均输出 96,000 样本，尾部 RMS 非零。合成数值结果不等于真实剧情同步；旧零偏移短缺和原测试范围见[早期审核](lovelive-pr34-local-audit-20261110.md)。

## 真实 LL 宿主与安装范围

用户提供并明确允许运行的 LL 0.2.0-RC 宿主归档仅在隔离目录解压，SHA-256 `18176bbeecdeeb959ebaaa3bd6aca83b07e8dc3e102db0ebd8a1c8fc0c34ce57`；原归档与用户现有安装不改。该宿主的结构锚点校验保留，不能因其与标准包不同而放宽兼容检查。

1. 早期内部包 SHA-256 `f59d2318148389e867762cbc4b14257a25c92593a81d8a6ef57252906314e7b0`，97,353,728 字节，完成实际 EXE 解包、真实 LL 安装、重装、受控生成 JS 损坏修复、卸载恢复原始未集成 backend/index/bundle、再安装。卸载恢复不等于恢复归档中预装的旧 WebVideo+。
2. 该轮 SetupForm 使用隔离反射入口检查高级默认收起、可展开/收起、已安装 portable 模式锁及本地路径；不覆盖普通 Main 入口及全局配置发现。真实宿主编辑器启动与工具入口另有实测。
3. 资源 timer 修复后的 `84de89d1...` 包再次完成真实 EXE 提取、隔离宿主升级/安装与实际 GUI 排队导出；没有将旧包整个修复/卸载矩阵算作新包重新执行。
4. 修复包的非 GUI portable fixture 通过，无 ExportSmoke。普通/便携路径、会话、迁移、模式锁等早期背景检查详见[离线验收](portable-464-offline-final-20261110.md)，不代替真实图形运行。

## 真实双模型导出

- 隔离输入由用户已有模型工程复制。旧 demo 缺两个 lib 文件及默认 motion，首次预检正确失败；仅在隔离副本补齐宿主自带 runtime 文件并将默认动作指向已存在动作。原工程不改，不能声称原 demo 开箱即用。
- 同一组六个模型/配置/动作/场景哈希下，旧候选两次在 planning 的 120 秒 glTF 就绪屏障失败，无 MP4。第二次仅增加只读采样，诊断屏障字节在正式复测前恢复。失败日志保留。
- 修复仅在 LL job 副本将实际导入模块的一个 16 ms 准备 yield、两个 10 ms shader poll 接到真实资源计时器；就绪条件、剧情时钟、120 秒屏障及原始模型输入不变。
- 使用内部 `84de89d1...` 包，真实编辑器排队任务 `8d2dc023-b994-4bd0-bc83-5bca2f0ceb47` 完成，耗时 113.8259976 秒。输出 `ll-real-model-b4212502.mp4`，4,842,544 字节，SHA-256 `d908ea9429a52430eef3d3b2de2451cbac3360f938cbfcfe2922946413521825`。
- ffprobe：H.264 High / Intel QSV，1280×720，30 fps，500 声明及实读帧，16.666667 秒。完整 FFmpeg 解码退出 0，错误日志为空。仅视频流，无音轨。
- 两层画面复核确认单 GLB 与 head/body 组合模型同时在场、三句中文及说话人顺序正确；0.5 与 1 秒的非周期对照确认头发、手及上身动作变化。约 2 秒周期的相近帧不单独作为运动证据，量化像素差仅辅助直接目检。
- 原归档及三份全局配置 hash 未变，任务 `cacheCleaned=true` 且实际 jobDir 已删除，sourceHash 保留。收尾按可执行路径及命令行两种清单均确认自有进程为 0。不操作用户下载终端，不改网络或安全设置。

详细本地证据位于同级隔离目录 `ll-install-qa-20261110/`：`REPORT.md`、`pre-fix-input-verification.json`、`post-fix-input-verification.json`、`ffprobe-b4212502.json`、`decode-b4212502-errors.log`、`frames-b4212502/` 与 `final-safety-evidence.json`。这些文件不作为公开素材随包分发。

## 独立短 LL 音频标记场景

与双模型场景分开新建隔离工程，使用相同 `84de89d1...` 内部候选和本地合成音频，不使用第三方音乐，不改原模型场景。

- 输出 `ll-audio-sync-b4212502.mp4`，192,200 字节，SHA-256 `620be99dcc25ad22cb84a94a5324f3e006d74a7e96ab9c39406db5c8944d81bd`。1280×720、30 fps、287 实读帧，视频与 AAC 音轨时长均为 9.566667 秒；全片解码错误日志为空。
- 解码 PCM 在 1.20–1.40、2.20–2.40、3.20–3.40、4.20–4.40、5.20–5.40 秒测得脉冲，主频约 440 / 880 / 440 / 880 / 440 Hz，证实两秒源素材循环。1.19 秒前与 6 秒后 RMS 为 0，6.2 秒应有的下一脉冲不存在。
- 画面有原生淡变，不能用颜色首次占优时间冒充脚本命令时刻。绿色开启与红色关闭的 10% 转换阈值为 1.3667 / 6.3667 秒，50% 阈值为 1.7667 / 6.7667 秒，各相差 5 秒，与脚本音频区间一致。
- 结论仅为短场景音轨、循环与画面时序核验通过。现有标记只能把实际停止界定在末脉冲 5.4 秒后至下一脉冲 6.2 秒前；不证明采样级 6.000 秒停止、语音口型或完整长片同步。无音轨的双模型片仍不作为音频证据。
- 缓存已清理，自有进程为 0；原输入、原模型成片、归档及三份全局配置 hash 保持不变。证据为 `ll-install-qa-20261110/audio-evidence/` 下 `ffprobe.json`、`full-decode-errors.log`、`measurements.json`、`transition-frequency-analysis.json`、`post-input-verification.json` 与 `safety-final.json`。

本测试仍针对本地内部候选，不自动迁移为 CI 稳定 EXE 的包级验收。

## 发布前未覆盖与发布边界（历史）

更早的 4.6.4 候选合成配对样本曾仅完成 plan，render 被保护检查中止，MyGO 当时未运行。该失败保持原结论；本轮精确源码 CI 的合成 scene-tail 通过是后续独立结果，不能倒填旧轮次。旧候选两条 Terre 共 184 项 CLI 断言也不计作当前安装器的安装、升级或恢复通过。

- 当前最终包的 MyGO 真实宿主未重新验收，完整约 24 分钟含音视频成片未测。自动 anchor 策略、专有 Live2D SDK 像素、实测显存降低、广泛模型库与长时稳定性不列为通过。
- 本地 LL 成片使用 `InternalBuild` 包。当时 CI 稳定 EXE 尚未取回作为最终发行资产，不能仅凭生产等价把文件身份或全部安装器入口行为视为相同。
- CI 未包含本机真实 LL 引擎 chunk 或私有模型，离线合成 timer 合同不替代真实宿主结果；本次实际模型导出结果也不扩展至其他模型/宿主。
- 发布前要求分别核验文档提交、最终发布提交与公开资产；当时未声明下载、更新通道或 Release 已上线。
