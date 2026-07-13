import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10">
      <h1 className="display-title">{title}</h1>
      <div className="divider" />
      {description && <p className="section-desc mb-0">{description}</p>}
      {children}
    </div>
  );
}
