import { useOutletContext } from "react-router-dom";
import { Panel } from "../../shared/components/Panel";
import type { EstablishmentDetail } from "../../types";
import { CategoryEditor } from "../components/CategoryEditor";
import { CategoryQuickAdd } from "../components/CategoryQuickAdd";
import { ProductQuickAdd } from "../components/ProductQuickAdd";

type Context = {
  establishment: EstablishmentDetail;
  reload: () => Promise<void>;
};

export function EstablishmentCatalogPage() {
  const { establishment, reload } = useOutletContext<Context>();
  const sortedCategories = [...establishment.categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <CategoryQuickAdd
          establishmentId={establishment.id}
          defaultDisplayOrder={establishment.categories.length + 1}
          onCreated={reload}
        />
        <ProductQuickAdd
          establishmentId={establishment.id}
          categories={sortedCategories}
          onCreated={reload}
        />
      </div>

      <Panel className="p-0">
        <div className="border-b border-slate-200 p-5">
          <h3 className="font-semibold">Catálogo</h3>
          <p className="mt-1 text-sm text-slate-500">
            Reordene, edite, oculte ou exclua categorias e produtos.
          </p>
        </div>
        {sortedCategories.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
        ) : (
          sortedCategories.map((category, index) => (
            <CategoryEditor
              key={category.id}
              category={category}
              categories={sortedCategories}
              index={index}
              total={sortedCategories.length}
              aiImageCredits={establishment.aiImageCredits}
              reload={reload}
            />
          ))
        )}
      </Panel>
    </div>
  );
}
