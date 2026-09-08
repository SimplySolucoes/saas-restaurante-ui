import { getPublicCardapioData } from "@/lib/api";
import MenuPublicoView from "@/components/menu-publico/MenuPublicoView";
import MenuClientView from "@/components/menu/MenuClientView";
import { isModoPrePago } from "@/lib/gestaoNav";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export default async function CardapioPublicoPage({ params }) {
  const { slug } = await params;

  const data = await getPublicCardapioData(slug);

  if (!data) {
    notFound();
  }

  /* Modo bar / pré-pago: mesmo URL público com carrinho e código de retirada. */
  if (isModoPrePago(data.restaurante)) {
    return (
      <MenuClientView
        initialData={data}
        slug={slug}
      />
    );
  }

  return (
    <MenuPublicoView
      restaurante={data.restaurante}
      categorias={data.categorias}
      itens={data.itens}
    />
  );
}
