import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { Footer } from '@/components/footer';
// AI feature temporarily disabled
// import { AISearchTrigger } from '@/components/search';
import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import { i18n } from '@/lib/i18n';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;

  // Check if the language is valid, prevent invalid language codes (e.g. 'api') from causing errors
  if (!i18n.languages.includes(lang as (typeof i18n.languages)[number])) {
    notFound();
  }

  const base = baseOptions(lang);

  // Flatten: if the docs root has a single folder (api/), lift its children
  // directly to the root so no collapsible section header appears in the sidebar.
  const rawTree = source.pageTree[lang];
  const firstChild = rawTree.children[0];
  const tree =
    firstChild?.type === 'folder'
      ? { ...rawTree, children: firstChild.children }
      : rawTree;

  return (
    <DocsLayout
      {...base}
      tree={tree}
      links={[]}
      sidebar={{
        defaultOpenLevel: 0,
      }}
    >
      {children}
      <Footer lang={lang} />
      {/* AI feature temporarily disabled */}
      {/* <AISearchTrigger /> */}
    </DocsLayout>
  );
}
