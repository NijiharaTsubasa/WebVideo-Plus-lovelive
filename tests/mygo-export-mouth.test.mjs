import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const controller = readFileSync(new URL('../browser/mygo-mouth.js', import.meta.url), 'utf8');

function speechFixture() {
  const levels = new Map();
  const textures = [];
  let modelMouth = 0;
  let beforeModelUpdate;
  const live = { key: 'live', sourceType: 'live2d', pixiContainer: { children: [{ internalModel: {
    coreModel: { setParamFloat: (_id, value) => { modelMouth = value; } },
    on: (_name, callback) => { beforeModelUpdate = callback; },
  } }] } };
  const image = { key: 'image', sourceType: 'img', uuid: 'mouth-image' };
  const stage = {
    figureObjects: [live, image],
    getStageObjByKey: key => stage.figureObjects.find(object => object.key === key),
    setModelMouthY: (key, value) => levels.set(key, value),
    getCurrentMouthValue: key => levels.get(key) ?? null,
    resetMouthY: key => levels.delete(key),
    performMouthSyncAnimation: (_key, _item, state) => textures.push(state),
  };
  const imageAnimation = { targetId: 'image', mouthAnimation: { open: 'open', halfOpen: 'half', close: 'closed' } };
  const context = vm.createContext({ performance: { now: () => 100 }, __wgProbe: {
    core: { gameplay: { pixiStage: stage } },
    stageManager: { getCalculationStageState: () => ({ figureAssociatedAnimation: [imageAnimation] }) },
  } });
  vm.runInContext(controller + '\ninstallMygoExportMouth()', context);
  return { stage, levels, textures, context, renderExpression: value => {
    modelMouth = value;
    beforeModelUpdate?.();
    return modelMouth;
  } };
}

test('shared controller uses native speech and restores the MyGO Live2D closed-mouth state', () => {
  const { stage, levels, context, renderExpression } = speechFixture();
  context.__exportSetSpeechMode('live', false);
  stage.setModelMouthY('live', 80);
  stage.setModelMouthY('other', 99);
  context.__exportRefreshMouth();
  assert.equal(renderExpression(1), 0.6);
  assert.equal(levels.has('other'), false);
  context.__exportSetSpeechMode('live', true);
  context.__mygoApplyLip({ target: 'live', active: true, value: 1 });
  assert.ok(renderExpression(1) < 1);
  context.__mygoApplyLip({ target: 'live', active: false, value: 0 });
  assert.equal(levels.has('live'), false);
  assert.equal(renderExpression(1), 0);
});

test('shared controller releases glTF speech and restores the static closed-mouth image', () => {
  const { context, levels, textures } = speechFixture();
  context.__exportSetSpeechMode('gltf', true);
  context.__mygoApplyLip({ target: 'gltf', active: true, value: 1 });
  assert.ok(levels.get('gltf') > 50);
  context.__mygoApplyLip({ target: 'gltf', active: false, value: 0 });
  assert.equal(levels.has('gltf'), false);
  context.__exportSetSpeechMode('image', true);
  context.__mygoApplyLip({ target: 'image', active: true, value: 1 });
  context.__mygoApplyLip({ target: 'image', active: false, value: 0 });
  assert.deepEqual(textures, ['half_open', 'closed']);
});
