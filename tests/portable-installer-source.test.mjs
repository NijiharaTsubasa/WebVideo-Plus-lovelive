import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
// Run scripts/configure-installer.mjs before this read-only generated-source check.
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('installer/Installer.cs');
test('portable choice is an advanced child, collapsed and unchecked on initial construction',()=>{
 assert.match(source,/advanced\.Controls\.Add\(portableInstall\)/);
 assert.doesNotMatch(source,/(?<!advanced\.)Controls\.Add\(portableInstall\)/);
 assert.match(source,/advanced=new Panel\{[^}]*Visible=false/);
 assert.match(source,/advancedToggle=new CheckBox\{[^}]*\}/);
 assert.doesNotMatch(source,/advancedToggle=new CheckBox\{[^}]*Checked=true/);
 assert.doesNotMatch(source,/portableInstall=new CheckBox\{[^}]*Checked=true/);
 assert.match(source,/if\(advancedToggle.Checked\)\{[\s\S]*?ay=PlaceCheck\(portableInstall,gap,ay,innerWidth,scale\)/);
 assert.doesNotMatch(source,/y=PlaceCheck\(portableInstall,pad,y,width,scale\)/);
});
