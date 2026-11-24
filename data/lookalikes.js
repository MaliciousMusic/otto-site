// The positive reference and the eight negative control classes of G02-MEASUREMENT-V1, as illustrations.
export const LOOKALIKES = [
  { id: 'fixed', name: 'Fixed attractor', why: 'Nothing is lost, so nothing needs replacing. A stone also lasts.' },
  { id: 'travel', name: 'Travelling wave', why: 'A shape moves, the pieces do not change. Nothing is renewed.' },
  { id: 'noise', name: 'Random noise', why: 'Pieces come and go, all of them through the outside door.' },
  { id: 'external', name: 'Fed from outside', why: 'The amount is steady because someone keeps delivering. Every new piece is imported.' },
  { id: 'converter', name: 'Inner conversion', renews: true, why: 'Pieces are lost all the time and made again inside, at the same rate. This is the positive reference. It is a narrow property: no feedback, no autonomy, no life is implied.' },
  { id: 'standing', name: 'Standing wave', why: 'Parts take turns swelling. The same pieces, passed back and forth.' },
  { id: 'mirror', name: 'External replay', why: 'It copies a candidate exactly, but its births come from outside. Only the ledger of origins tells them apart.' },
  { id: 'carousel', name: 'Periodic transport', why: 'Pieces go round and round. None is made, none is lost.' },
  { id: 'decay', name: 'Unfed decay', why: 'It is only disappearing slowly. Nothing is produced.' },
];
