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

Real-model export with the repaired candidate is still pending. Unit/contract results do not establish successful MP4 output or final timing/visual parity. No release artifact was built as part of these checks.

## Follow-up: isolated test compilation lists

CI run 42778603842 at b4212502 failed because the glTF scanner's explicit Add-Type source list omitted the new LoveLiveResourceTimers dependency. The same omission was corrected in resource-url-scan and scene-only-tail. Other adapter references use all source files, a precompiled assembly, or a test stub and do not need this dependency added.

Local offline checks after the list-only fix: glTF preflight 22 passed; resource Scan/Resolve 114 passed; scene-only tail 97 passed. No graphics host was started. Production source and browser bytes are unchanged from b4212502; an artifact built from that commit remains labeled with that original build source SHA. The prior CI failure is not a pass, and real-model export remains pending.