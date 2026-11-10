# LoveLive resource preparation timers (2026-11-10)

Scope: the 4.6.4 LoveLive adapter patches only the actually imported offscreen-character module in a job-local prepared copy. Exactly three resource preparation timer calls use the host wall-clock bridge: the 16 ms preparation yield and the two 10 ms shader-compile poll sites. Unsupported, ambiguous and already-patched shapes fail closed. Original projects, ordinary WebGAL/MyGO, global story-clock advancement, readiness predicates and the 120-second barrier timeout are unchanged.

The bridge does not actively cancel these resource timers. Existing timeout/failure handling and BrowserHost disposal own teardown; no broader lifecycle change is included.

Validation:
- Full production C# compilation passed (existing warnings only).
- Production C# patch applied to a local real LoveLive offscreen-character chunk; exactly the three intended timer calls changed, syntax and extracted-function runtime contracts passed.
- Offline synthetic production-patch contracts passed and are now invoked by native-smoke CI. CI does not contain or validate the local real-engine chunk.
- LoveLive browser routing: 19 passed.
- Final local Node regression pass, excluding the unrelated ci-npm-cache.test.mjs file: 357 passed, 1 skipped, 0 failed.
- Independent code review completed before finalizing this change.

At this unit/contract stage, real-model export was pending and no release artifact was built. That historical scope is retained; the later isolated real-host result is recorded below. Unit/contract results alone do not establish MP4 output or timing/visual parity.

## Follow-up: isolated test compilation lists

CI run 42778603842 at b4212502 failed because the glTF scanner's explicit Add-Type source list omitted the new LoveLiveResourceTimers dependency. The same omission was corrected in resource-url-scan and scene-only-tail. Other adapter references use all source files, a precompiled assembly, or a test stub and do not need this dependency added.

Local offline checks after the list-only fix: glTF preflight 22 passed; resource Scan/Resolve 114 passed; scene-only tail 97 passed. No graphics host was started. Production source and browser bytes are unchanged from b4212502; an artifact built from that commit remains labeled with that original build source SHA. The prior CI failure is not a pass. Subsequent exact-source CI and real-model export are recorded separately below.

## Exact-source CI and isolated real-model result

- [CI 42779189109](https://github.com/Stakataka-3030/WebVideo-Plus/actions/runs/42779189109) succeeded at `8680cfdb3f0303317e2a2288ad1df79beb481ab7`. JPEG readiness, captureFault, expressionContract, autosaveContract, autosave and scene-tail passed. PNG is NA for the frozen 4.6.4 product, not a pass.
- The normally compressed internal installer was built from `b4212502ab30b6437e1353f2be2c5cfaf78426e9`: `dist/WebVideo+-Setup-0.8.16-dev.exe`, 97,357,824 bytes, SHA-256 `84de89d14bebd1102a19dc1d26b17223ae3046f0cbb8e7a9a0e1ed4a08418549`. `.build/ll-resource-timers-candidate/production-equivalence.json` proves an empty production diff to `8680cfdb`; it does not change the artifact's build source or internal channel.
- The same six model/config/motion/scene hashes that timed out twice at 120 seconds before the fix completed on an isolated real LL host after installing this EXE: 113.8259976 seconds, 720p30, 500 frames, 16.666667-second MP4. No readiness barrier was weakened, and the diagnostic barrier bytes were restored before the test.
- Full decode and two visual reviews passed for both the single GLB and head/body composite, three Chinese dialogue lines and non-periodic motion samples. The video has no audio stream; it is not audio synchronization evidence. A separate short LL test using local synthetic audio subsequently passed track, two-second loop and five-second visual-interval checks: 287 frames at 30 fps, 9.566667 seconds for both video and AAC. This does not establish sample-exact stop timing or long-form voice/lip synchronization; see the candidate record for measurements and limits.
- The old demo required documented runtime/default-motion repairs only in the isolated input copy. This is not an out-of-box demo success or broad model-library claim. The latest EXE received actual install/upgrade and export verification; the full repeat/repair/uninstall matrix belongs to the earlier candidate.

See the [current candidate acceptance record](terre-1.1.17-candidate-20261110.md) for exact source and artifact identities, preserved failures, cleanup and remaining limits. Status remains unpublished; the local internal package is not the CI stable release artifact.
