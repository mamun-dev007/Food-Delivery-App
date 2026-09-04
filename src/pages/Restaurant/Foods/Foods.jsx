import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import {
  fetchMyFoods,
  createFood,
  updateFood,
  deleteFood,
} from "../../../services/foodService";
import { fetchOwnerCategories } from "../../../services/restaurantService";
import { Skeleton } from "../../../components/dashboard/Skeleton";

const LOW_STOCK_THRESHOLD = 10;

const standardCategories = [
  "Pizza",
  "Burger",
  "Salad",
  "Pasta",
  "Dessert",
  "Snacks",
  "Sushi",
  "Rice",
  "Drinks",
  "Main",
];

const emptyForm = {
  name: "",
  category: "",
  price: "",
  discount: 0,
  stock: "",
  image: "",
  description: "",
  ingredients: "",
  isAvailable: true,
};

const PAGE_SIZE = 20;

function toCardShape(db) {
  return {
    id: db.id || db.food_id,
    name: db.name || db.food_name,
    category: db.category,
    price: Number(db.price || 0),
    discount: Number(db.discount || 0),
    rating: Number(db.rating != null ? db.rating : 4.5),
    image: db.image || "",
    stock: Number(db.stock || 0),
    description: db.description || "",
    ingredients: db.ingredients || [],
    isAvailable: db.is_available != null ? db.is_available : true,
  };
}

const AddEditForm = ({ initial, submitting, onSubmit, onClose }) => {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || "",
          category: initial.category || "",
          price: initial.price != null ? initial.price : "",
          discount: initial.discount != null ? initial.discount : 0,
          stock: initial.stock != null ? initial.stock : "",
          image: initial.image || "",
          description: initial.description || "",
          ingredients: Array.isArray(initial.ingredients)
            ? initial.ingredients.join(", ")
            : initial.ingredients || "",
          isAvailable: initial.isAvailable != null ? initial.isAvailable : true,
        }
      : emptyForm
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "isAvailable") {
      setForm((p) => ({ ...p, isAvailable: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) return;
    onSubmit({
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      discount: parseFloat(form.discount || 0),
      stock: parseInt(form.stock || 0, 10),
      image: form.image,
      description: form.description,
      ingredients: form.ingredients,
      isAvailable: form.isAvailable,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Food Name</span>
        </label>
        <input
          name="name"
          className="input input-bordered"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Category</span>
        </label>
        <input
          name="category"
          className="input input-bordered"
          value={form.category}
          onChange={handleChange}
          placeholder="e.g. Pizza, Burger"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Price (৳)</span>
          </label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            className="input input-bordered"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Discount (%)</span>
          </label>
          <input
            name="discount"
            type="number"
            min="0"
            max="100"
            className="input input-bordered"
            value={form.discount}
            onChange={handleChange}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Quantity / Stock</span>
          </label>
          <input
            name="stock"
            type="number"
            min="0"
            className="input input-bordered"
            value={form.stock}
            onChange={handleChange}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Image URL</span>
          </label>
          <input
            name="image"
            className="input input-bordered"
            value={form.image}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <textarea
          name="description"
          className="textarea textarea-bordered"
          rows={2}
          value={form.description}
          onChange={handleChange}
          placeholder="Short description of the dish..."
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Ingredients (comma separated)</span>
        </label>
        <input
          name="ingredients"
          className="input input-bordered"
          value={form.ingredients}
          onChange={handleChange}
          placeholder="rice, chicken, spices, oil"
        />
      </div>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-3">
          <input
            name="isAvailable"
            type="checkbox"
            className="toggle toggle-primary"
            checked={form.isAvailable}
            onChange={handleChange}
          />
          <span className="label-text">Available for ordering</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Food"}
        </button>
      </div>
    </form>
  );
};

const FoodCardSkeleton = () => (
  <div className="card bg-base-100 shadow-md">
    <Skeleton className="h-44 w-full rounded-none" />
    <div className="card-body p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/6" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-5 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  </div>
);

const FoodsSkeleton = ({ count = 6 }) => (
  <div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <FoodCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const CategoriesSkeleton = () => (
  <div className="card bg-base-100 shadow-md p-4">
    <Skeleton className="h-4 w-24 mb-3" />
    <Skeleton className="h-8 w-full mb-3" />
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={`h-8 w-full ${i % 2 === 0 ? "w-4/5" : ""}`} />
      ))}
    </div>
  </div>
);

const ManageFoods = ({ base = "/restaurant" } = {}) => {
  const [foods, setFoods] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchMyFoods();
      setFoods(list);
    } catch {
      toast.error("Failed to load foods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(() => foods.map(toCardShape), [foods]);

  const categoriesMenu = useMemo(() => {
    const counts = {};
    for (const f of cards) {
      const c = f.category || "Other";
      counts[c] = (counts[c] || 0) + 1;
    }
    return standardCategories
      .filter((c) => counts[c])
      .concat(Object.keys(counts).filter((c) => !standardCategories.includes(c)))
      .map((c) => ({ name: c, count: counts[c] }));
  }, [cards]);

  const filtered = useMemo(() => {
    return cards.filter((f) => {
      const matchCategory =
        activeCategory === "All" || f.category === activeCategory;
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [cards, activeCategory, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const pages = [1];
    if (safePage > 3) pages.push("…");
    const start = Math.max(2, safePage - 1);
    const end = Math.min(pageCount - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < pageCount - 2) pages.push("…");
    pages.push(pageCount);
    return pages;
  }, [pageCount, safePage]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, search]);

  const goToPage = (p) => {
    const target = Math.min(Math.max(1, p), pageCount);
    setPage(target);
    document.querySelector(".foods-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (modal?.mode === "edit") {
        await updateFood(modal.food.id, data);
        toast.success("Food updated!");
      } else {
        await createFood(data);
        toast.success("Food added!");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteFood(id);
      toast.success("Food deleted!");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to delete food.");
    }
  };

  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Manage Foods</h1>
          <p className="text-base-content/60 mt-1">
            These are the dishes your restaurant created. Edit or delete any of
            them anytime.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModal({ mode: "add" })}
            className="btn btn-primary gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          {loading ? (
            <CategoriesSkeleton />
          ) : (
          <div className="card bg-base-100 shadow-md p-4 lg:sticky lg:top-24">
            <h2 className="font-semibold text-base-content mb-3 px-1">
              Categories
            </h2>
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full mb-3"
            />
            <ul className="menu menu-sm w-full gap-1">
              <li>
                <button
                  onClick={() => setActiveCategory("All")}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    activeCategory === "All"
                      ? "bg-primary text-primary-content font-medium"
                      : "hover:bg-base-200"
                  }`}
                >
                  <span>All</span>
                  <span className="badge badge-ghost badge-sm">{cards.length}</span>
                </button>
              </li>
              {categoriesMenu.map((cat) => (
                <li key={cat.name}>
                  <button
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                      activeCategory === cat.name
                        ? "bg-primary text-primary-content font-medium"
                        : "hover:bg-base-200"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="badge badge-ghost badge-sm">{cat.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          )}
        </aside>

        <div className="flex-1">
          {loading ? (
            <FoodsSkeleton count={PAGE_SIZE} />
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-base-content/50">
              {cards.length === 0
                ? "You haven't created any foods yet. Add your first dish above."
                : "No dishes found. Try a different search or category."}
            </div>
          ) : (
            <>
            <div className="foods-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {visible.map((food) => (
                <div
                  key={food.id}
                  className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <figure className="relative h-44 overflow-hidden">
                    {food.image ? (
                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-base-200 text-base-content/30">
                        <UtensilsCrossed className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 flex gap-1">
                      <span className="badge badge-secondary">{food.category}</span>
                      {food.discount > 0 && (
                        <span className="badge badge-error">-{food.discount}%</span>
                      )}
                    </span>
                    <span className="absolute top-3 right-3 badge badge-ghost gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      {food.rating}
                    </span>
                    {!food.isAvailable && (
                      <span className="absolute bottom-3 left-3 badge badge-neutral">
                        Unavailable
                      </span>
                    )}
                  </figure>
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="card-title text-lg truncate">{food.name}</h2>
                      {food.stock <= 0 ? (
                        <span className="badge badge-error badge-sm">Out of stock</span>
                      ) : food.stock < LOW_STOCK_THRESHOLD ? (
                        <span className="badge badge-warning badge-sm">Low stock</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-base-content/50 line-clamp-2">
                      {food.description || "No description yet."}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="flex items-baseline gap-2">
                        {food.discount > 0 && (
                          <span className="text-sm text-base-content/40 line-through">
                            ৳{food.price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-primary">
                          ৳
                          {(
                            food.price -
                            (food.price * (food.discount || 0)) / 100
                          ).toFixed(2)}
                        </span>
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-sm gap-1"
                          onClick={() => setModal({ mode: "edit", food })}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-error gap-1"
                          onClick={() => handleDelete(food.id, food.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pageCount > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-base-content/60">
                  Showing{" "}
                  {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} foods
                </p>
                <div className="flex items-center gap-1">
                  <button
                    className="btn btn-sm"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                  >
                    « Prev
                  </button>
                  {pageNumbers.map((p, i) =>
                    p === "…" ? (
                      <span key={`e-${i}`} className="px-1 text-base-content/40">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`btn btn-sm ${p === safePage ? "btn-primary" : ""}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="btn btn-sm"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= pageCount}
                  >
                    Next »
                  </button>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {modal.mode === "edit" ? "Edit Food" : "Add New Food"}
            </h3>
            <AddEditForm
              initial={modal.mode === "edit" ? modal.food : null}
              submitting={submitting}
              onSubmit={handleSubmit}
              onClose={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFoods;