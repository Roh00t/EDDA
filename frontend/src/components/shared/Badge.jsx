import { PROVENANCE } from "../../lib/report-utils.js";

export default function Badge({ provenance }) {
  const meta = PROVENANCE[provenance] ?? PROVENANCE.no_data_found;
  return <span className={meta.className}>{meta.label}</span>;
}
