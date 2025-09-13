import { getPublicCardapioData } from "@/lib/api";
import MenuClientView from "@/components/menu/MenuClientView";
import { notFound } from 'next/navigation';

export default async function MenuPage({ params }) {

  const { slug, numeroMesa } = params;

  const data = await getPublicCardapioData(slug);

  if (!data) {
    notFound();
  }

  return (
    <MenuClientView 
      initialData={data}
      slug={slug}
      numeroMesa={numeroMesa}
    />
  );
}