# Portable option placement: local unpublished correction

> 历史阶段记录：以下“未运行 / 未 CI / 未推送”等状态只适用于当时的候选和测试轮次，不是当前发布状态。后续资源 timer 修复、精确源码 CI、真实 LL 安装与成片结果见[当前候选验收](terre-1.1.17-candidate-20261110.md)；旧失败及旧包身份仍保留。

Based on `efee2de` in isolated branch `port/portable-advanced-464-20261110`.

The portable installation checkbox is now an Advanced settings child and the first row inside the existing scrollable advanced panel. Advanced settings remains collapsed by default. Installation mode detection, existing installation mode locking and portable storage behavior are unchanged.

Validation uses generated-source regression checks and compilation only; no installer window or real Terre application is opened. This is a local unpublished UI correction, not a release. Product versions remain unchanged.
