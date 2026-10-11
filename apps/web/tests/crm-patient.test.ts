import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patientAge, patientRegistration } from '../src/lib/crm-patient';

test('age follows the civil birthday, including newborns, leap years and invalid dates', () => {
  assert.equal(patientAge('2000-10-12', '2026-10-11'), 25);
  assert.equal(patientAge('2000-10-11', '2026-10-11'), 26);
  assert.equal(patientAge('2026-10-11', '2026-10-11'), 0);
  assert.equal(patientAge('2000-02-29', '2025-02-28'), 24);
  assert.equal(patientAge('2000-02-29', '2025-03-01'), 25);
  assert.equal(patientAge('2026-10-12', '2026-10-11'), null);
  assert.equal(patientAge('2001-02-29', '2026-10-11'), null);
  assert.equal(patientAge('2000-04-31', '2026-10-11'), null);
  assert.equal(patientAge('', '2026-10-11'), null);
});

test('registration normalizes contact data and rejects incomplete or invalid patient information', () => {
  const valid = {fullName:'Paciente Exemplo',birthDate:'1980-01-02',sex:'female',email:'TEST@EXAMPLE.INVALID',phone:'(11) 99999-9999',postalCode:'01001-000',street:'Praça da Sé',number:'S/N',complement:'',neighborhood:'Sé',city:'São Paulo',state:'sp',medications:'Nenhum'};
  const result = patientRegistration(valid);
  assert.equal(result.phone, '11999999999');
  assert.equal(result.postalCode, '01001000');
  assert.equal(result.email, 'test@example.invalid');
  assert.equal(result.state, 'SP');
  for (const override of [{birthDate:'1980-02-31'}, {birthDate:'2999-01-01'}, {sex:'invalid'}, {postalCode:'123'}, {phone:'123'}, {email:'invalid'}, {state:'XX'}, {medications:''}, {street:''}, {number:''}, {fullName:'A'}, {medications:'x'.repeat(3001)}]) {
    assert.throws(() => patientRegistration({...valid,...override}));
  }
});
