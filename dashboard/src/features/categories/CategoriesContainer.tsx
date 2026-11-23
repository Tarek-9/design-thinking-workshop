// Applications are read only to block deleting a Category that still has any.

import { useApplications } from '@/queries/applications';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useEditCategory,
  useReorderCategories,
} from '@/queries/categories';

import { CategoriesScreen } from './CategoriesScreen';

export function CategoriesContainer() {
  const { mutate: create } = useCreateCategory();
  const { mutate: edit } = useEditCategory();
  const { mutate: remove } = useDeleteCategory();
  const { mutate: reorder } = useReorderCategories();
  const categories = useCategories();
  const applications = useApplications();

  return (
    <CategoriesScreen
      categories={categories}
      applications={applications}
      onCreate={(draft) => {
        create(draft);
      }}
      onEdit={(id, draft) => {
        edit({ id, change: draft });
      }}
      onSetActive={(id, active) => {
        edit({ id, change: { active } });
      }}
      onDelete={(id) => {
        remove(id);
      }}
      onReorder={(orderedIds) => {
        reorder(orderedIds);
      }}
    />
  );
}
