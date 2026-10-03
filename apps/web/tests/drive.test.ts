import { test } from 'node:test';
import assert from 'node:assert/strict';
import { driveId, driveName, detectDriveMime, canPreviewDrive, driveRange } from '../src/lib/drive-policy';

test('private file names and IDs reject traversal, controls and spoofing characters',()=>{
  for(const name of ['../x','../../etc/passwd','x/y','x\\y','\0a','a\r\nb','..','a\u202eb'])assert.throws(()=>driveName(name));
  assert.equal(driveName('  Relatório clínico 2026.pdf  '),'Relatório clínico 2026.pdf');
  assert.throws(()=>driveId('../secret'));assert.equal(driveId(null,true),null);
});
test('inline MIME is derived from bytes; active/unknown formats are only attachments',()=>{
  assert.equal(detectDriveMime(Buffer.from('%PDF-1.7\n'),'report.pdf','application/pdf'),'application/pdf');
  assert.throws(()=>detectDriveMime(Buffer.from('<script>alert(1)</script>'),'report.pdf','application/pdf'));
  assert.equal(detectDriveMime(Buffer.from('<svg onload="alert(1)"/>'),'image.svg','image/svg+xml'),'application/octet-stream');
  assert.equal(detectDriveMime(Buffer.from('<script>x</script>'),'notes.txt','text/plain'),'text/plain');
  assert.equal(detectDriveMime(Buffer.from([0,255]),'notes.txt','text/plain'),'application/octet-stream');
  assert.equal(detectDriveMime(Buffer.from('office'),'report.docx','application/octet-stream'),'application/octet-stream');
  assert.equal(canPreviewDrive('text/html'),false);assert.equal(canPreviewDrive('image/svg+xml'),false);
});
test('Safari/media ranges support partial, open and suffix ranges and reject invalid requests',()=>{
  assert.deepEqual(driveRange('bytes=0-1',50),{start:0,end:1});
  assert.deepEqual(driveRange('bytes=10-',50),{start:10,end:49});
  assert.deepEqual(driveRange('bytes=-5',50),{start:45,end:49});
  assert.deepEqual(driveRange('bytes=0-100',50),{start:0,end:49});
  for(const r of ['bytes=50-','bytes=10-4','bytes=-0','bytes=0-1,3-4','bytes=-','bad'])assert.throws(()=>driveRange(r,50));
  assert.throws(()=>driveRange('bytes=0-0',0));
});
