// Chip picker for assigning a record to a construction phase.
import ChipSelect from './ChipSelect';

export default function PhaseSelect({ phases, value, onChange, noneLabel = 'Not assigned', label = 'Construction Phase' }) {
  const options = [
    { value: null, label: noneLabel },
    ...[...phases].sort((a, b) => a.order - b.order).map((phase) => ({ value: phase.id, label: phase.name })),
  ];
  return <ChipSelect label={label} options={options} value={value ?? null} onChange={onChange} />;
}
