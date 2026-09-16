type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="placeholder-page" aria-labelledby="placeholder-title">
      <h1 id="placeholder-title">{title}</h1>
    </main>
  );
}

