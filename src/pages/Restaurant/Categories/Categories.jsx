import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Loader2, Tags } from "lucide-react";
import {
  fetchOwnerCategories,
  createOwnerCategory,
  deleteOwnerCategory,
} from "../../../services/restaurantService";
import { ListSkeleton } from "../../../components/dashboard/Skeleton";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await fetchOwnerCategories());
    } catch {
      toast.error("Failed to load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setAdding(true);
    try {
      const cat = await createOwnerCategory(clean);
      setCategories((prev) => [...prev, cat]);
      setName("");
      toast.success(`Category "${clean}" added!`);
    } catch (err) {
      toast.error(
        err?.response?.data?.error || err?.message || "Could not add category."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOwnerCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete category.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-base-content/60 mt-1">
          Manage your restaurant's food categories. Use them when adding foods.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
        <input
          className="input input-bordered flex-1"
          placeholder="New category name (e.g. Pizza)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary gap-1"
          disabled={adding || !name.trim()}
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
      </form>

      {loading ? (
        <ListSkeleton rows={8} avatar={false} />
      ) : categories.length === 0 ? (
        <div className="card bg-base-100 shadow-md p-10 text-center">
          <Tags className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
          <p className="text-base-content/50">
            No categories yet. Add your first category above.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <div key={c.id} className="badge badge-lg badge-outline gap-3 p-4">
              {c.name}
              <button
                onClick={() => handleDelete(c.id)}
                className="text-error"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
