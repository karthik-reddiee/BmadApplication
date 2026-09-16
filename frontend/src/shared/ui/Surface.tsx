import type { PropsWithChildren } from "react";

type SurfaceProps = PropsWithChildren<{
  className?: string;
  "aria-labelledby"?: string;
}>;

export function Surface({ children, className = "", ...props }: SurfaceProps) {
  return (
    <section className={`surface ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}

