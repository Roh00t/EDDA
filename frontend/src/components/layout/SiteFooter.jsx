import { BigBack } from "performative-ui";

export default function SiteFooter({ columns }) {
  const footerColumns = columns.map((column) => ({
    heading: column.heading,
    links: column.links.map((label) => ({ label, href: "#" })),
  }));

  return (
    <footer className="site-footer-wrap">
      <BigBack company="EDDA" columns={footerColumns} gradient copyright="Signals, not verdicts." />
    </footer>
  );
}
